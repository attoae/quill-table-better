import Quill from 'quill';
import Delta from 'quill-delta';
import type { EmitterSource, Range } from 'quill';
import type { Props } from './types';
import type { BindingObject, Context } from './types/keyboard';
import {
  cellId,
  TableCellBlock,
  TableThBlock,
  TableCell,
  TableTh,
  TableRow,
  TableThRow,
  TableBody,
  TableThead,
  TableTemporary,
  TableContainer,
  tableId,
  TableCol,
  TableColgroup
} from './formats/table';
import TableHeader from './formats/header';
import TableList, { ListContainer } from './formats/list';
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
import ToolbarTable, { TableSelect } from './ui/toolbar-table';
import { getCellId, getCorrectCellBlot } from './utils';
import TableToolbar from './modules/toolbar';
import TableClipboard from './modules/clipboard';

interface Options {
  language?: string | {
    name: string;
    content: Props;
  }
  menus?: string[]
  toolbarButtons?: {
    whiteList?: string[];
    singleWhiteList?: string[];
  }
  toolbarTable?: boolean;
}

type Line = TableCellBlock | TableHeader | ListContainer;

const Module = Quill.import('core/module');

class Table extends Module {
  language: Language;
  cellSelection: CellSelection;
  operateLine: OperateLine;
  tableMenus: TableMenus;
  tableSelect: TableSelect;
  options: Options;

  private abortController = new AbortController();

  private static formatsRegistered = false;
  static keyboardBindings: { [propName: string]: BindingObject };

  static register() {
    if (Table.formatsRegistered) {
      return;
    }

    Quill.register(TableCellBlock, true);
    Quill.register(TableThBlock, true);
    Quill.register(TableCell, true);
    Quill.register(TableTh, true);
    Quill.register(TableRow, true);
    Quill.register(TableThRow, true);
    Quill.register(TableBody, true);
    Quill.register(TableThead, true);
    Quill.register(TableTemporary, true);
    Quill.register(TableContainer, true);
    Quill.register(TableCol, true);
    Quill.register(TableColgroup, true);
    Quill.register({
      'modules/clipboard': TableClipboard,
      'modules/toolbar': TableToolbar,
      'formats/table-better': ToolbarTable,
      'formats/table-list': TableList,
      'formats/table-header': TableHeader
    }, true);

    Table.formatsRegistered = true;
  }

  constructor(quill: Quill, options: Options) {
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
    quill.root.addEventListener('keyup', this.handleKeyup.bind(this), { signal: this.abortController.signal });
    quill.root.addEventListener('mousedown', this.handleMousedown.bind(this), { signal: this.abortController.signal });
    quill.root.addEventListener('scroll', this.handleScroll.bind(this), { signal: this.abortController.signal });
    this.listenDeleteTable();
    this.registerToolbarTable(options?.toolbarTable);
  }

  /**
   * Destroy the module and clean up resources
   * This should be called when the Quill instance is being destroyed
   */
  destroy(): void {
    this.cellSelection.cleanupEventListeners();
    this.abortController.abort();
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

  deleteTableTemporary(source: EmitterSource = Quill.sources.API) {
    const temporaries = this.quill.scroll.descendants(TableTemporary);
    for (const temporary of temporaries) {
      temporary.remove();
    }
    this.hideTools();
    this.quill.update(source);
  }

  getTable(
      range = this.quill.getSelection()
  ): [null, null, null, -1] | [TableContainer, TableRow, TableCell, number] {
    if (range == null) return [null, null, null, -1];
    const [block, offset] = this.quill.getLine(range.index);
    if (block == null || block.statics.blotName !== TableCellBlock.blotName) {
      return [null, null, null, -1];
    }
    const cell = block.parent as TableCell;
    const row = cell.parent as TableRow;
    const table = row.parent.parent as TableContainer;
    return [table, row, cell, offset];
  }

  handleKeyup(e: KeyboardEvent) {
    if (!this.quill.isEnabled()) return;
    this.cellSelection.handleKeyup(e);
    if (e.ctrlKey && (e.key === 'z' || e.key === 'y')) {
      this.hideTools();
      this.clearHistorySelected();
    }
    this.updateMenus(e);
  }

  handleMousedown(e: MouseEvent) {
    if (!this.quill.isEnabled()) return;
    this.tableSelect?.hide(this.tableSelect.root);
    const table = (e.target as Element).closest('table');
    // In-table Editor
    if (table && !this.quill.root.contains(table)) {
      this.hideTools();
      return;
    }
    if (!table) {
      this.hideTools();
      this.handleMouseMove();
      return;
    }
    this.cellSelection.handleMousedown(e);
    this.cellSelection.setDisabled(true);
  }

  // If the default selection includes table cells,
  // automatically select the entire table
  handleMouseMove() {
    let table: Element = null;
    const handleMouseMove = (e: MouseEvent) => {
      if (!table) table = (e.target as Element).closest('table');
    }

    const handleMouseup = (e: MouseEvent) => {
      if (table) {
        const tableBlot = Quill.find(table);
        if (!tableBlot) return;
        // @ts-expect-error
        const index = tableBlot.offset(this.quill.scroll);
        // @ts-expect-error
        const length = tableBlot.length();
        const range = this.quill.getSelection();
        const minIndex = Math.min(range.index, index);
        const maxIndex = Math.max(range.index + range.length, index + length);
        this.quill.setSelection(
            minIndex,
            maxIndex - minIndex,
            Quill.sources.USER
        );
      }
      this.quill.root.removeEventListener('mousemove', handleMouseMove);
      this.quill.root.removeEventListener('mouseup', handleMouseup);
    }

    this.quill.root.addEventListener('mousemove', handleMouseMove, { signal: this.abortController.signal });
    this.quill.root.addEventListener('mouseup', handleMouseup, { signal: this.abortController.signal });
  }

  handleScroll() {
    if (!this.quill.isEnabled()) return;
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
    const style = `width: 100%`;
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
          [TableCell.blotName]: { 'data-row': id }
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

  // Completely delete empty tables
  listenDeleteTable() {
    this.quill.on(Quill.events.TEXT_CHANGE, (delta, old, source) => {
      if (source !== Quill.sources.USER) return;
      const tables = this.quill.scroll.descendants(TableContainer);
      if (!tables.length) return;
      const deleteTables: TableContainer[] = [];
      tables.forEach(table => {
        const tbody = table.tbody();
        const thead = table.thead();
        if (!tbody && !thead) deleteTables.push(table);
      });
      if (deleteTables.length) {
        for (const table of deleteTables) {
          table.remove();
        }
        this.hideTools();
        this.quill.update(Quill.sources.API);
      }
    });
  }

  private registerToolbarTable(toolbarTable: boolean) {
    if (!toolbarTable) {
      return;
    }

    const toolbar = this.quill.getModule('toolbar') as TableToolbar;
    const button = toolbar.container.querySelector('button.ql-table-better');

    if (!button || !this.tableSelect.root) {
      return;
    }

    button.appendChild(this.tableSelect.root);

    button.addEventListener(
        'click',
        (e: MouseEvent) => this.tableSelect.handleClick(e, this.insertTable.bind(this)),
        { signal: this.abortController.signal },
    );

    document.addEventListener(
        'click',
        (e: MouseEvent) => {
          const visible = e.composedPath().includes(button);
          if (visible) return;
          if (!this.tableSelect.root.classList.contains('ql-hidden')) {
            this.tableSelect.hide(this.tableSelect.root);
          }
        },
        { signal: this.abortController.signal },
    );
  }

  showTools(force?: boolean) {
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
      const blot = line.replaceWith(TableCellBlock.blotName, cellId) as TableCellBlock;
      const tableModule = this.quill.getModule('table-better');
      const cell = getCorrectCellBlot(blot);
      cell && tableModule.cellSelection.setSelected(cell.domNode, false);
    }
  }
}

function makeCellBlockHandler(key: string) {
  return {
    key,
    format: ['table-cell-block', 'table-th-block'],
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
    format: ['table-cell', 'table-th'],
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