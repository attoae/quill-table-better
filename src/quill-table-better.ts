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

interface Options extends Props {
  language: string
}

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
  }

  constructor(quill: any, options: Options) {
    super(quill, options);
    quill.clipboard.addMatcher('td, th', matchTableCell);
    quill.clipboard.addMatcher('tr', matchTable);
    quill.clipboard.addMatcher('col', matchTableCol);
    quill.clipboard.addMatcher('table', matchTableTemporary);
    this.language = new Language(options?.language);
    this.cellSelection = new CellSelection(quill);
    this.operateLine = new OperateLine(quill, this);
    this.tableMenus = new TableMenus(quill, this);
    document.addEventListener('keyup', this.handleKeyup.bind(this));
    quill.root.addEventListener('mousedown', this.handleMousedown.bind(this));
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

  deleteTableTemporary() {
    const temporaries = this.quill.scroll.descendants(TableTemporary);
    for (const temporary of temporaries) {
      temporary.remove();
    }
    this.hideTools();
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
    }
  }

  handleMousedown(e: MouseEvent) {
    const table = (e.target as Element).closest('table');
    if (!table) return this.hideTools();
    this.cellSelection.handleMousedown(e);
  }

  hideTools() {
    this.cellSelection?.clearSelected();
    this.operateLine?.hideDragBlock();
    this.operateLine?.hideDragTable();
    this.operateLine?.hideLine();
    this.tableMenus?.hideMenus();
    this.tableMenus?.destroyTablePropertiesForm();
  }

  insertTable(rows: number, columns: number) {
    const range = this.quill.getSelection();
    if (range == null) return;
    const base = new Delta()
      .retain(range.index)
      .insert('\n', { [TableTemporary.blotName]: {} });
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
    this.quill.setSelection(range.index + 1, Quill.sources.SILENT);
    this.showTools();
  }

  private showTools() {
    const [table, , cell] = this.getTable();
    this.cellSelection.setSelected(cell.domNode);
    this.tableMenus.showMenus();
    this.tableMenus.updateMenus(table.domNode);
    this.tableMenus.updateTable(table.domNode);
  }
}

const keyboardBindings = {
  'table-cell-block backspace': makeCellBlockHandler('Backspace'),
  'table-cell-block delete':  makeCellBlockHandler('Delete')
}

function makeCellBlockHandler(key: string) {
  return {
    key,
    format: ['table-cell-block'],
    collapsed: true,
    handler(range: any, context: any) {
      const [line] = this.quill.getLine(range.index);
      const { offset, suffix } = context;
      if (
        offset === 0 &&
        (
          !line.prev ||
          line.prev.statics.blotName !== 'table-cell-block'
        )
      ) {
        return false;
      }
      // Delete isn't from the end
      if (offset !== 0 && !suffix && key === 'Delete') {
        return false;
      }
      return true;
    }
  }
}

Table.keyboardBindings = keyboardBindings;

export default Table;