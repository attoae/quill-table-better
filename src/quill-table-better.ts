import Quill from 'quill';
import Delta from 'quill-delta';
import {
  TableCellBlock,
  TableCell,
  TableRow,
  TableCol,
  TableColGroup,
  TableBody,
  TableContainer,
  tableId,
} from './formats/table';
import { matchTableCell, matchTableCol } from './utils/clipboard-matchers';

const Module = Quill.import('core/module');

class Table extends Module {
  static register() {
    Quill.register(TableCellBlock, true);
    Quill.register(TableCell, true);
    Quill.register(TableRow, true);
    Quill.register(TableCol, true);
    Quill.register(TableColGroup, true);
    Quill.register(TableBody, true);
    Quill.register(TableContainer, true);
  }

  constructor(quill: any, options: any) {
    super(quill, options);
    this.listenBalanceCells();
    quill.clipboard.addMatcher('td', matchTableCell);
    quill.clipboard.addMatcher('table', matchTableCol);
  }

  deleteColumn() {
    const [table, row, cell] = this.getTable();
    if (cell == null) return;
    const column = row.children.indexOf(cell);
    table.deleteColumn(column);
    this.quill.update(Quill.sources.USER);
  }

  deleteRow() {
    const [, row] = this.getTable();
    if (row == null) return;
    row.remove();
    this.quill.update(Quill.sources.USER);
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

  insertColumn(offset: any) {
    const range = this.quill.getSelection();
    const [table, row, cell] = this.getTable(range);
    if (cell == null) return;
    const column = row.children.offset(cell);
    table.insertColumn(column + offset);
    this.quill.update(Quill.sources.USER);
    let shift = row.parent.children.indexOf(row);
    if (offset === 0) {
      shift += 1;
    }
    this.quill.setSelection(
      range.index + shift,
      range.length,
      Quill.sources.SILENT,
    );
  }

  insertColumnLeft() {
    this.insertColumn(0);
  }

  insertColumnRight() {
    this.insertColumn(1);
  }

  insertRow(offset: any) {
    const range = this.quill.getSelection();
    const [table, row, cell] = this.getTable(range);
    if (cell == null) return;
    const index = row.parent.children.indexOf(row);
    table.insertRow(index + offset);
    this.quill.update(Quill.sources.USER);
    if (offset > 0) {
      this.quill.setSelection(range, Quill.sources.SILENT);
    } else {
      this.quill.setSelection(
        range.index + row.children.length,
        range.length,
        Quill.sources.SILENT,
      );
    }
  }

  insertRowAbove() {
    this.insertRow(0);
  }

  insertRowBelow() {
    this.insertRow(1);
  }

  insertTable(rows: any, columns: any) {
    const range = this.quill.getSelection();
    if (range == null) return;
    const delta = new Array(rows).fill(0).reduce(memo => {
      const text = new Array(columns).fill('\n').join('');
      return memo.insert(text, { table: tableId() });
    }, new Delta().retain(range.index));
    this.quill.updateContents(delta, Quill.sources.USER);
    this.quill.setSelection(range.index, Quill.sources.SILENT);
  }

  listenBalanceCells() {
    this.quill.on(Quill.events.SCROLL_OPTIMIZE, (mutations: any) => {
      mutations.some((mutation: any) => {
        if (mutation.target.tagName === 'TABLE') {
          this.quill.once(Quill.events.TEXT_CHANGE, (delta: Delta, old: any, source: string) => {
            if (source !== Quill.sources.USER) return;
            this.quill.scroll.descendants(TableContainer).forEach((table: any) => {
              table.balanceCells();
            });
          });
          return true;
        }
        return false;
      });
    });
  }
}

export default Table;
