import Quill from 'quill';
import Delta from 'quill-delta';
import {
  cellId,
  TableCellBlock,
  TableCell,
  TableRow,
  TableBody,
  TableTemporary,
  TableContainer,
  tableId,
  TableCol,
  TableColgroup
} from './formats/table';
import TableHeader from './formats/header';
import { ListContainer } from './formats/list';
import { 
  matchTable,
  matchTableCell,
  matchTableCol,
  matchTableTemporary
} from './utils/clipboard-matchers';
import Language from './language';
import CellSelection from './ui/cell-selection';
import OperateLine from './ui/operate-line';
import TableMenus from './ui/table-menus';
import { CELL_DEFAULT_WIDTH } from './config';
import ToolbarTable, { TableSelect } from './ui/toolbar-table';
import { getCellId, getCorrectCellBlot } from './utils';
import TableToolbar from './modules/toolbar';
import TableClipboard from './modules/clipboard';

interface Context {
  [propName: string]: any
}

interface Options {
  language?: string | {
    name: string
    content: Props
  }
  menus?: string[]
  toolbarButtons?: {
    whiteList?: string[]
    singleWhiteList?: string[]
  }
  toolbarTable?: boolean
}

type Line = TableCellBlock | TableHeader | ListContainer;

const Module = Quill.import('core/module');

class Table extends Module {
  static register() {
    Quill.register(TableCellBlock, true);
    Quill.register(TableCell, true);
    Quill.register(TableRow, true);
    Quill.register(TableBody, true);
    Quill.register(TableTemporary, true);
    Quill.register(TableContainer, true);
    Quill.register(TableCol, true);
    Quill.register(TableColgroup, true);
    Quill.register('modules/toolbar', TableToolbar, true);
    Quill.register('modules/clipboard', TableClipboard, true);
  }

  constructor(quill: any, options: Options) {
    super(quill, options);
    quill.clipboard.addMatcher('td, th', matchTableCell);
    quill.clipboard.addMatcher('tr', matchTable);
    quill.clipboard.addMatcher('col', matchTableCol);
    quill.clipboard.addMatcher('table', matchTableTemporary);
    this.language = new Language(options?.language);
    this.cellSelection = new CellSelection(quill, this);
    this.operateLine = new OperateLine(quill, this);
    this.tableMenus = new TableMenus(quill, this);
    this.tableSelect = new TableSelect();
    quill.root.addEventListener('keyup', this.handleKeyup.bind(this));
    quill.root.addEventListener('mousedown', this.handleMousedown.bind(this));
    quill.root.addEventListener('scroll', this.handleScroll.bind(this));
    this.registerToolbarTable(options?.toolbarTable);
  }

  clearHistorySelected() {
    const [table] = this.getTable();
    if (!table) return;
    const selectedTds: Element[] = Array.from(
      table.domNode.querySelectorAll('td.ql-cell-focused, td.ql-cell-selected')
    );
    for (const td of selectedTds) {
      td.classList && td.classList.remove('ql-cell-focused', 'ql-cell-selected');
    }
  }

  deleteTable() {
    const [table] = this.getTable();
    if (table == null) return;
    const offset = table.offset();
    table.remove();
    this.hideTools();
    this.quill.update(Quill.sources.USER);
    this.quill.setSelection(offset, Quill.sources.SILENT);
  }

  deleteTableTemporary(source: string = Quill.sources.API) {
    const temporaries = this.quill.scroll.descendants(TableTemporary);
    for (const temporary of temporaries) {
      temporary.remove();
    }
    this.hideTools();
    this.quill.update(source);
  }

  getTable(range = this.quill.getSelection()) {
    if (range == null) return [null, null, null, -1];
    const [block, offset] = this.quill.getLine(range.index);
    if (block == null || block.statics.blotName !== TableCellBlock.blotName) {
      return [null, null, null, -1];
    }
    const cell = block.parent;
    const row = cell.parent;
    const table = row.parent.parent;
    return [table, row, cell, offset];
  }

  handleKeyup(e: KeyboardEvent) {
    this.cellSelection.handleKeyup(e);
    if (e.ctrlKey && (e.key === 'z' || e.key === 'y')) {
      this.hideTools();
      this.clearHistorySelected();
    }
    this.updateMenus(e);
  }

  handleMousedown(e: MouseEvent) {
    this.tableSelect?.hide(this.tableSelect.root);
    const table = (e.target as Element).closest('table');
    if (!table) return this.hideTools();
    this.cellSelection.handleMousedown(e);
    this.cellSelection.setDisabled(true);
  }

  handleScroll() {
    this.hideTools();
    this.tableMenus?.updateScroll(true);
  }

  hideTools() {
    this.cellSelection?.clearSelected();
    this.cellSelection?.setDisabled(false);
    this.operateLine?.hideDragBlock();
    this.operateLine?.hideDragTable();
    this.operateLine?.hideLine();
    this.tableMenus?.hideMenus();
    this.tableMenus?.destroyTablePropertiesForm();
  }

  insertTable(rows: number, columns: number) {
    const range = this.quill.getSelection(true);
    if (range == null) return;
    if (this.isTable(range)) return;
    const style = `width: ${CELL_DEFAULT_WIDTH * columns}px`
    const formats = this.quill.getFormat(range.index - 1);
    const [, offset] = this.quill.getLine(range.index);
    const isExtra = !!formats[TableCellBlock.blotName] || offset !== 0;
    const _offset = isExtra ? 2 : 1;
    const extraDelta = isExtra ? new Delta().insert('\n') : new Delta();
    const base = new Delta()
      .retain(range.index)
      .delete(range.length)
      .concat(extraDelta)
      .insert('\n', { [TableTemporary.blotName]: { style } });
    const delta = new Array(rows).fill(0).reduce(memo => {
      const id = tableId();
      return new Array(columns).fill('\n').reduce((memo, text) => {
        return memo.insert(text, {
          [TableCellBlock.blotName]: cellId(),
          [TableCell.blotName]: { 'data-row': id, width: `${CELL_DEFAULT_WIDTH}` }
        });
      }, memo);
    }, base);
    this.quill.updateContents(delta, Quill.sources.USER);
    this.quill.setSelection(range.index + _offset, Quill.sources.SILENT);
    this.showTools();
  }

  // Inserting tables within tables is currently not supported
  private isTable(range: Range) {
    const formats = this.quill.getFormat(range.index);
    return !!formats[TableCellBlock.blotName];
  }

  private registerToolbarTable(toolbarTable: boolean) {
    if (!toolbarTable) return;
    Quill.register('formats/table-better', ToolbarTable, true);
    const toolbar = this.quill.getModule('toolbar');
    const button = toolbar.container.querySelector('button.ql-table-better');
    if (!button || !this.tableSelect.root) return;
    button.appendChild(this.tableSelect.root);
    button.addEventListener('click', (e: MouseEvent) => {
      this.tableSelect.handleClick(e, this.insertTable.bind(this));
    });
    document.addEventListener('click', (e: MouseEvent) => {
      const visible = e.composedPath().includes(button);
      if (visible) return;
      if (!this.tableSelect.root.classList.contains('ql-hidden')) {
        this.tableSelect.hide(this.tableSelect.root);
      }
    });
  }

  private showTools(force?: boolean) {
    const [table, , cell] = this.getTable();
    if (!table || !cell) return;
    this.cellSelection.setDisabled(true);
    this.cellSelection.setSelected(cell.domNode, force);
    this.tableMenus.showMenus();
    this.tableMenus.updateMenus(table.domNode);
    this.tableMenus.updateTable(table.domNode);
  }

  private updateMenus(e: KeyboardEvent) {
    if (!this.cellSelection.selectedTds.length) return;
    if (
      e.key === 'Enter' ||
      (e.ctrlKey && e.key === 'v')
    ) {
      this.tableMenus.updateMenus();
    }
  }
}

const keyboardBindings = {
  'table-cell down': makeTableArrowHandler(false),
  'table-cell up': makeTableArrowHandler(true),
  'table-cell-block backspace': makeCellBlockHandler('Backspace'),
  'table-cell-block delete': makeCellBlockHandler('Delete'),
  'table-header backspace': makeTableHeaderHandler('Backspace'),
  'table-header delete': makeTableHeaderHandler('Delete'),
  'table-header enter': {
    key: 'Enter',
    collapsed: true,
    format: ['table-header'],
    suffix: /^$/,
    handler(range: Range, context: Context) {
      const [line, offset] = this.quill.getLine(range.index);
      const delta = new Delta()
        .retain(range.index)
        .insert('\n', context.format)
        .retain(line.length() - offset - 1)
        .retain(1, { header: null });
      this.quill.updateContents(delta, Quill.sources.USER);
      this.quill.setSelection(range.index + 1, Quill.sources.SILENT);
      this.quill.scrollSelectionIntoView();
    },
  },
  'table-list backspace': makeTableListHandler('Backspace'),
  'table-list delete': makeTableListHandler('Delete'),
  'table-list empty enter': {
    key: 'Enter',
    collapsed: true,
    format: ['table-list'],
    empty: true,
    handler(range: Range, context: Context) {
      const { line } = context;
      const { cellId } = line.parent.formats()[line.parent.statics.blotName];
      const blot = line.replaceWith(TableCellBlock.blotName, cellId);
      const tableModule = this.quill.getModule('table-better');
      const cell = getCorrectCellBlot(blot);
      cell && tableModule.cellSelection.setSelected(cell.domNode, false);
    }
  }
}

function makeCellBlockHandler(key: string) {
  return {
    key,
    format: ['table-cell-block'],
    collapsed: true,
    handler(range: Range, context: Context) {
      const [line] = this.quill.getLine(range.index);
      const { offset, suffix } = context;
      if (offset === 0 && !line.prev) return false;
      const blotName = line.prev?.statics.blotName;
      if (
        offset === 0 &&
        (
          blotName === ListContainer.blotName ||
          blotName === TableCellBlock.blotName ||
          blotName === TableHeader.blotName
        )
      ) {
        return removeLine.call(this, line, range);
      }
      // Delete isn't from the end
      if (offset !== 0 && !suffix && key === 'Delete') {
        return false;
      }
      return true;
    }
  }
}

// Prevent table default up and down keyboard events.
// Implemented by the makeTableArrowVerticalHandler function.
function makeTableArrowHandler(up: boolean) {
  return {
    key: up ? 'ArrowUp' : 'ArrowDown',
    collapsed: true,
    format: ['table-cell'],
    handler() {
      return false;
    }
  };
}

function makeTableHeaderHandler(key: string) {
  return {
    key,
    format: ['table-header'],
    collapsed: true,
    empty: true,
    handler(range: Range, context: Context) {
      const [line] = this.quill.getLine(range.index);
      if (line.prev) {
        return removeLine.call(this, line, range);
      } else {
        const cellId = getCellId(line.formats()[line.statics.blotName]);
        line.replaceWith(TableCellBlock.blotName, cellId);
      }
    }
  }
}

function makeTableListHandler(key: string) {
  return {
    key,
    format: ['table-list'],
    collapsed: true,
    empty: true,
    handler(range: Range, context: Context) {
      const [line] = this.quill.getLine(range.index);
      const cellId = getCellId(line.parent.formats()[line.parent.statics.blotName]);
      line.replaceWith(TableCellBlock.blotName, cellId);      
    }
  }
}

function removeLine(line: Line, range: Range) {
  const tableModule = this.quill.getModule('table-better');
  line.remove();
  tableModule?.tableMenus.updateMenus();
  this.quill.setSelection(range.index - 1, Quill.sources.SILENT);
  return false;
}

Table.keyboardBindings = keyboardBindings;

export default Table;