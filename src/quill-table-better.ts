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
import OperateLine from './ui/operate-line';
import CellSelection from './ui/cell-selection';
import TableMenus from './ui/table-menus';

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

  constructor(quill: any, options: any) {
    super(quill, options);
    quill.clipboard.addMatcher('td', matchTableCell);
    quill.clipboard.addMatcher('tr', matchTable);
    quill.clipboard.addMatcher('col', matchTableCol);
    quill.clipboard.addMatcher('table', matchTableTemporary);
    this.cellSelection = new CellSelection(quill);
    this.tableMenus = new TableMenus(quill, this);
    this.operateLine = new OperateLine(quill, this);
  }

  deleteTable() {
    const [table] = this.getTable();
    if (table == null) return;
    const offset = table.offset();
    table.remove();
    this.quill.update(Quill.sources.USER);
    this.quill.setSelection(offset, Quill.sources.SILENT);
  }

  getTable(range = this.quill.getSelection()) {
    if (range == null) return [null, null, null, -1];
    const [cell, offset] = this.quill.getLine(range.index);
    if (cell == null || cell.statics.blotName !== TableCell.blotName) {
      return [null, null, null, -1];
    }
    const row = cell.parent;
    const table = row.parent.parent;
    return [table, row, cell, offset];
  }

  insertTable(rows: number, columns: number) {
    const range = this.quill.getSelection();
    if (range == null) return;
    const delta = new Array(rows).fill(0).reduce(memo => {
      const id = tableId();
      return new Array(columns).fill('\n').reduce((memo, text) => {
        return memo.insert(text, {
          'table-cell-block': cellId(),
          'table-cell': { 'data-row': id }
        });
      }, memo);
    }, new Delta().retain(range.index));
    this.quill.updateContents(delta, Quill.sources.USER);
    this.quill.setSelection(range.index, Quill.sources.SILENT);
  }
}

export default Table;