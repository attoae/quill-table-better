import Quill from 'quill';
import Delta from 'quill-delta';
import {
  TableCellBlock,
  TableCell,
  TableRow,
  TableBody,
  TableTemporary,
  TableContainer,
  tableId,
} from './formats/table';
import { matchTableCell, matchTable, matchTableTemporary } from './utils/clipboard-matchers';
import { getEventComposedPath } from './utils';
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
  }

  constructor(quill: any, options: any) {
    super(quill, options);
    quill.clipboard.addMatcher('td', matchTableCell);
    quill.clipboard.addMatcher('tr', matchTable);
    quill.clipboard.addMatcher('table', matchTableTemporary);
    this.cellSelection = new CellSelection(quill);
    this.tableMenus = new TableMenus(quill, this);
    this.quill.root.addEventListener('mousemove', (e: MouseEvent) => {
      const path = getEventComposedPath(e);
      if (!path || !path.length) return;
      let cellNode, tableNode;
      const mousePosition = {
        clientX: 0,
        clientY: 0
      }
      for (const node of path) {
        if (cellNode && tableNode) break;
        if (node.tagName && node.tagName.toUpperCase() === 'TABLE') {
          tableNode = node;
        }
        if (node.tagName && node.tagName.toUpperCase() === 'TD') {
          cellNode = node;
          Object.assign(mousePosition, {
            clientX: e.clientX,
            clientY: e.clientY
          });
        }
      }
      if (!tableNode) {
        if (this.operateLine && !this.operateLine.drag) {
          this.operateLine.hideLine();
          this.operateLine.hideDragBlock();
        }
        return;
      }
      if (!this.operateLine) {
        this.operateLine = new OperateLine(quill, { tableNode, cellNode, mousePosition });
      } else {
        if (this.operateLine.drag || !cellNode) return;
        this.operateLine.updateProperty({ tableNode, cellNode, mousePosition });
      }
    });
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
      const text = new Array(columns).fill('\n').join('');
      return memo.insert(text, { table: tableId() });
    }, new Delta().retain(range.index));
    this.quill.updateContents(delta, Quill.sources.USER);
    this.quill.setSelection(range.index, Quill.sources.SILENT);
  }
}

export default Table;
