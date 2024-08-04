import Quill from 'quill';
import { filterWordStyle, getCellChildBlot } from '../utils';
import TableHeader from './header';
import { ListContainer } from './list';
import { CELL_DEFAULT_WIDTH } from '../config';

const Block = Quill.import('blots/block');
const Break = Quill.import('blots/break');
const Container = Quill.import('blots/container');

const CELL_ATTRIBUTE = ['data-row', 'width', 'height', 'colspan', 'rowspan', 'style'];
const TABLE_ATTRIBUTE = ['border', 'cellspacing', 'style'];
const STYLE_RULES = ['color', 'border', 'width', 'height'];
const COL_ATTRIBUTE = ['width'];

class TableCellBlock extends Block {
  static create(value: string) {
    const node = super.create();
    if (value) {
      node.setAttribute('data-cell', value);
    } else {
      node.setAttribute('data-cell', cellId());
    }
    return node;
  }

  getAlign() {
    for (const name of this.domNode.classList) {
      if (/ql-align-/.test(name)) {
        return name.split('ql-align-')[1];
      }
    }
    return '';
  }

  format(name: string, value: string | Props) {
    const cellId = this.formats()[this.statics.blotName];
    if (name === TableCell.blotName && value) {
      this.wrap(TableRow.blotName);
      return this.wrap(name, value);
    } else if (name === TableContainer.blotName) {
      this.wrap(name, value);
    } else if (name === 'header') {
      super.format('table-header', value);
    } else if (name === 'list') {
      this.wrap(ListContainer.blotName, cellId);
      return this.replaceWith('table-list', value);
    } else {
      super.format(name, value);
    }
  }

  formats() {
    return { [this.statics.blotName]: this.domNode.getAttribute('data-cell') };
  }
}
TableCellBlock.blotName = 'table-cell-block';
TableCellBlock.className = 'ql-table-block';
TableCellBlock.tagName = 'P';

class TableCell extends Container {
  checkMerge() {
    if (
      super.checkMerge() &&
      this.next.children.head != null &&
      this.next.children.head.formats
    ) {
      const thisHead = this.children.head.formats()[this.children.head.statics.blotName];
      const thisTail = this.children.tail.formats()[this.children.tail.statics.blotName];
      const nextHead = this.next.children.head.formats()[this.next.children.head.statics.blotName];
      const nextTail = this.next.children.tail.formats()[this.next.children.tail.statics.blotName];
      return (
        thisHead === thisTail &&
        thisHead === nextHead &&
        thisHead === nextTail
      );
    }
    return false;
  }
  
  static create(value: Props) {
    const node = super.create();
    const keys = Object.keys(value);
    for (const key of keys) {
      value[key] && node.setAttribute(key, value[key]);
    }
    return node;
  }

  static formats(domNode: HTMLElement) {
    const rowspan = this.getEmptyRowspan(domNode);
    const formats = CELL_ATTRIBUTE.reduce((formats: Props, attr) => {
      if (domNode.hasAttribute(attr)) {
        if (attr === 'rowspan' && rowspan) {
          formats[attr] = `${~~domNode.getAttribute(attr) - rowspan}`;
        } else {
          formats[attr] = filterWordStyle(domNode.getAttribute(attr));
        }
      }
      return formats;
    }, {});
    if (this.hasColgroup(domNode)){
      delete formats['width'];
      if (formats['style']) {
        (formats['style'] = formats['style'].replace(/width.*?;/g, ''));
      }
    }
    return formats;
  }

  formats() {
    const formats = this.statics.formats(this.domNode, this.scroll);
    return { [this.statics.blotName]: formats };
  }

  static getEmptyRowspan(domNode: Element) {
    let nextNode = domNode.parentElement.nextElementSibling;
    let rowspan = 0;
    while (nextNode && !nextNode.innerHTML.replace(/\s/g, '')) {
      rowspan++;
      nextNode = nextNode.nextElementSibling;
    }
    return rowspan;
  }

  static hasColgroup(domNode: Element) {
    while (domNode && domNode.tagName !== 'TBODY') {
      domNode = domNode.parentElement;
    }
    while (domNode) {
      if (domNode.tagName === 'COLGROUP') {
        return true;
      }
      domNode = domNode.previousElementSibling;
    }
    return false;
  }

  html() {
    const reg = /<(ol)[^>]*><li[^>]* data-list="bullet">(?:.*?)<\/li><\/(ol)>/gi;
    return this.domNode.outerHTML.replace(reg, (
      match: string, $1: string, $2: string
    ) => {
      return match.replace($1, 'ul').replace($2, 'ul');
    });
  }

  row() {
    return this.parent;
  }

  rowOffset() {
    if (this.row()) {
      return this.row().rowOffset();
    }
    return -1;
  }

  table() {
    let cur = this.parent;
    while (cur != null && cur.statics.blotName !== 'table-container') {
      cur = cur.parent;
    }
    return cur;
  }

  optimize(...args: unknown[]) {
    super.optimize(...args);
    this.children.forEach((child: TableCellBlock) => {
      if (child.next == null) return;
      const childFormats = child.formats()[child.statics.blotName];
      const nextFormats = child.next.formats()[child.next.statics.blotName];
      if (
        childFormats !== nextFormats &&
        child.statics.blotName === TableCellBlock.blotName
      ) {
        const next = this.splitAfter(child);
        if (next) next.optimize();
        // We might be able to merge with prev now
        if (this.prev) this.prev.optimize();
      }
    });
  }
}
TableCell.blotName = 'table-cell';
TableCell.tagName = 'TD';

class TableRow extends Container {
  checkMerge() {
    if (
      super.checkMerge() &&
      this.next.children.head != null &&
      this.next.children.head.formats
    ) {
      const thisHead = this.children.head.formats()[this.children.head.statics.blotName];
      const thisTail = this.children.tail.formats()[this.children.tail.statics.blotName];
      const nextHead = this.next.children.head.formats()[this.next.children.head.statics.blotName];
      const nextTail = this.next.children.tail.formats()[this.next.children.tail.statics.blotName];
      return (
        thisHead['data-row'] === thisTail['data-row'] &&
        thisHead['data-row'] === nextHead['data-row'] &&
        thisHead['data-row'] === nextTail['data-row']
      );
    }
    return false;
  }

  rowOffset() {
    if (this.parent) {
      return this.parent.children.indexOf(this);
    }
    return -1;
  }
}
TableRow.blotName = 'table-row';
TableRow.tagName = 'TR';

class TableBody extends Container {}
TableBody.blotName = 'table-body';
TableBody.tagName = 'TBODY';

class TableTemporary extends Block {
  static create(value: Props) {
    const node = super.create();
    const keys = Object.keys(value);
    for (const key of keys) {
      node.setAttribute(key, value[key]);
    }
    return node;
  }

  static formats(domNode: Element) {
    return TABLE_ATTRIBUTE.reduce((formats: Props, attr) => {
      if (domNode.hasAttribute(attr)) {
        formats[attr] = domNode.getAttribute(attr);
      }
      return formats;
    }, {});
  }

  formats() {
    const formats = this.statics.formats(this.domNode, this.scroll);
    return { [this.statics.blotName]: formats };
  }

  optimize(...args: unknown[]) {
    if (
      this.statics.requiredContainer &&
      this.parent instanceof this.statics.requiredContainer
    ) {
      const formats = this.formats()[this.statics.blotName];
      for (const key of TABLE_ATTRIBUTE) {
        if (formats[key]) {
          this.parent.domNode.setAttribute(key, formats[key]);
        } else {
          this.parent.domNode.removeAttribute(key);
        }
      }
    }
    super.optimize(...args);
  }
}
TableTemporary.blotName = 'table-temporary';
TableTemporary.className = 'ql-table-temporary';
TableTemporary.tagName = 'temporary';

class TableCol extends Block {
  static create(value: Props) {
    const node = super.create();
    const keys = Object.keys(value);
    for (const key of keys) {
      node.setAttribute(key, value[key]);
    }
    return node;
  }

  static formats(domNode: Element) {
    return COL_ATTRIBUTE.reduce((formats: Props, attr) => {
      if (domNode.hasAttribute(attr)) {
        formats[attr] = domNode.getAttribute(attr);
      }
      return formats;
    }, {});
  }

  formats() {
    const formats = this.statics.formats(this.domNode, this.scroll);
    return { [this.statics.blotName]: formats };
  }

  html() {
    return this.domNode.outerHTML;
  }
}
TableCol.blotName = 'table-col';
TableCol.tagName = 'COL';

class TableColgroup extends Container {}
TableColgroup.blotName = 'table-colgroup';
TableColgroup.tagName = 'COLGROUP';

class TableContainer extends Container {
  colgroup() {
    const [colgroup] = this.descendant(TableColgroup);
    return colgroup || this.findChild('table-colgroup');
  }

  deleteColumn(
    changeTds: [Element, number][],
    delTds: Element[],
    hideMenus: () => void,
    cols: Element[] = []
  ) {
    const body = this.tbody();
    const tableCells = this.descendants(TableCell);
    if (body == null || body.children.head == null) return;
    if (delTds.length === tableCells.length) {
      this.deleteTable();
      hideMenus();
    } else {
      for (const td of [...delTds, ...cols]) {
        if (td.parentElement.children.length === 1) {
          this.setCellRowspan(td.parentElement.previousElementSibling);
        }
        td.remove();
      }
      for (const [td, offset] of changeTds) {
        this.setCellColspan(Quill.find(td), offset);
      }
    }
  }

  deleteRow(rows: TableRow[], hideMenus: () => void) {
    const body = this.tbody();
    if (body == null || body.children.head == null) return;
    if (rows.length === body.children.length) {
      this.deleteTable();
      hideMenus();
    } else {
      const maxColumns = this.getMaxColumns(body.children.head.children);
      for (const row of rows) {
        const prev = this.getCorrectRow(row, maxColumns);
        prev && prev.children.forEach((child: TableCell) => {
          const rowspan = ~~child.domNode.getAttribute('rowspan');
          if (rowspan > 1) {
            child.domNode.setAttribute('rowspan', rowspan - 1);
          }
        });
        row.remove();
      }
    }
  }

  deleteTable() {
    this.remove();
  }

  findChild(blotName: string) {
    let child = this.children.head;
    while (child) {
      if (child.statics.blotName === blotName) {
        return child;
      }
      child = child.next;
    }
    return null;
  }

  getCorrectRow(prev: TableRow, maxColumns: number) {
    let isCorrect = false;
    while (prev && !isCorrect) {
      const prevMaxColumns = this.getMaxColumns(prev.children);
      if (maxColumns === prevMaxColumns) {
        isCorrect = true;
        return prev;
      }
      prev = prev.prev;
    }
    return prev;
  }

  getInsertRow(prev: TableRow, offset: number) {
    const body = this.tbody();
    if (body == null || body.children.head == null) return;
    const id = tableId();
    const row = this.scroll.create(TableRow.blotName);
    const maxColumns = this.getMaxColumns(body.children.head.children);
    const nextMaxColumns = this.getMaxColumns(prev.children);
    if (nextMaxColumns === maxColumns) {
      prev.children.forEach((child: TableCell) => {
        const formats = { height: '24', 'data-row': id };
        const colspan = ~~child.domNode.getAttribute('colspan');
        this.insertTableCell(colspan, formats, row);
      });
      return row;
    } else {
      prev = this.getCorrectRow(prev.prev, maxColumns);
      prev.children.forEach((child: TableCell) => {
        const formats = { height: '24', 'data-row': id };
        const colspan = ~~child.domNode.getAttribute('colspan');
        const rowspan = ~~child.domNode.getAttribute('rowspan');
        if (rowspan > 1) {
          child.domNode.setAttribute('rowspan', rowspan + 1);
        } else {
          this.insertTableCell(colspan, formats, row);
        }
      });
      return row;
    }
  }

  getMaxColumns(children: TableCell[]) {
    return children.reduce((num: number, child: TableCell) => {
      const colspan = ~~child.domNode.getAttribute('colspan') || 1;
      return num += colspan;
    }, 0);
  }

  insertColumn(position: number, isLast: boolean, w: number) {
    const colgroup = this.colgroup();
    const body = this.tbody();
    if (body == null || body.children.head == null) return;
    const columnCells: [TableRow, string, TableCell | null][] = [];
    const cols: [TableColgroup, TableCol | null][] = [];
    let row = body.children.head;
    while (row) {
      if (isLast) {
        const id = row.children.tail.domNode.getAttribute('data-row');
        columnCells.push([row, id, null]);
      } else {
        let ref = row.children.head;
        while (ref) {
          const { left, right } = ref.domNode.getBoundingClientRect();
          const id = ref.domNode.getAttribute('data-row');
          if (Math.abs(left - position) <= 2) {
            columnCells.push([row, id, ref]);
            break;
          } else if (Math.abs(right - position) <= 2 && !ref.next) {
            columnCells.push([row, id, null]);
            break;
          // rowspan > 1 (insertLeft, position + w is left)
          } else if (Math.abs(left - position - w) <= 2) {
            columnCells.push([row, id, ref]);
            break;
          // rowspan > 1 (position between left and right, rowspan++)
          } else if (position > left && position < right) {
            columnCells.push([null, id, ref]);
            break;
          }
          ref = ref.next;
        }
      }
      row = row.next;
    }
    if (colgroup) {
      if (isLast) {
        cols.push([colgroup, null]);
      } else {
        let correctLeft = 0;
        let correctRight = 0;
        let col = colgroup.children.head;
        while (col) {
          const { left, width } = col.domNode.getBoundingClientRect();
          correctLeft = correctLeft ? correctLeft : left;
          correctRight = correctLeft + width;
          if (Math.abs(correctLeft - position) <= 2) {
            cols.push([colgroup, col]);
            break;
          } else if (Math.abs(correctRight - position) <= 2 && !col.next) {
            cols.push([colgroup, null]);
            break;
          }
          correctLeft += width;
          col = col.next;
        }
      }
    }
    for (const [row, id, ref] of columnCells) {
      if (!row) {
        this.setCellColspan(ref, 1);
      } else {
        this.insertColumnCell(row, id, ref);
      }
    }
    for (const [colgroup, ref] of cols) {
      this.insertCol(colgroup, ref);
    }
  }

  insertCol(colgroup: TableColgroup, ref: TableCol | null) {
    const col = this.scroll.create(TableCol.blotName, { width: `${CELL_DEFAULT_WIDTH}` });
    colgroup.insertBefore(col, ref);
  }

  insertColumnCell(row: TableRow, id: string, ref: TableCell | null) {
    const colgroup = this.colgroup();
    const formats = colgroup ? { 'data-row': id } : { 'data-row': id, width: `${CELL_DEFAULT_WIDTH}` };
    const cell = this.scroll.create(TableCell.blotName, formats);
    const cellBlock = this.scroll.create(TableCellBlock.blotName, cellId());
    cell.appendChild(cellBlock);
    row.insertBefore(cell, ref);
    cellBlock.optimize();
  }

  insertRow(index: number, offset: number) {
    const body = this.tbody();
    if (body == null || body.children.head == null) return;
    const ref = body.children.at(index);
    const prev = ref ? ref : body.children.at(index - 1);
    const correctRow = this.getInsertRow(prev, offset);
    body.insertBefore(correctRow, ref);
  }

  insertTableCell(colspan: number, formats: Props, row: TableRow) {
    if (colspan > 1) {
      Object.assign(formats, { colspan });
    } else {
      delete formats['colspan'];
    }
    const cell = this.scroll.create(TableCell.blotName, formats);
    const cellBlock = this.scroll.create(TableCellBlock.blotName, cellId());
    cell.appendChild(cellBlock);
    row.appendChild(cell);
    cellBlock.optimize();
  }

  optimize(...args: unknown[]) {
    super.optimize(...args);
    const temporaries = this.descendants(TableTemporary);
    if (temporaries.length > 1) {
      temporaries.shift();
      for (const temporary of temporaries) {
        temporary.remove();
      }
    }
  }

  setCellColspan(cell: TableCell, offset: number) {
    const blotName = cell.statics.blotName;
    const formats = cell.formats()[blotName];
    const colspan = (~~formats['colspan'] || 1) + offset;
    const childBlot = getCellChildBlot(cell);
    if (colspan > 1) {
      Object.assign(formats, { colspan });
    } else {
      delete formats['colspan'];
    }
    childBlot.format(blotName, formats);
  }

  setCellRowspan(parentElement: Element) {
    while (parentElement) {
      const children = parentElement.querySelectorAll('td[rowspan]');
      if (children.length) {
        for (const child of children) {
          const cell = Quill.find(child);
          const blotName = cell.statics.blotName;
          const formats = cell.formats()[blotName];
          const rowspan = (~~formats['rowspan'] || 1) - 1;
          const childBlot = getCellChildBlot(cell);
          if (rowspan > 1) {
            Object.assign(formats, { rowspan });
          } else {
            delete formats['rowspan'];
          }
          childBlot.format(blotName, formats);
        }
        break;
      }
      parentElement = parentElement.previousElementSibling;
    }
  }

  tbody() {
    const [body] = this.descendant(TableBody);
    return body || this.findChild('table-body');
  }

  temporary() {
    const [temporary] = this.descendant(TableTemporary);
    return temporary;
  } 
}
TableContainer.blotName = 'table-container';
TableContainer.className = 'ql-table-better';
TableContainer.tagName = 'TABLE';

TableContainer.allowedChildren = [TableBody, TableTemporary, TableColgroup];
TableBody.requiredContainer = TableContainer;
TableTemporary.requiredContainer = TableContainer;
TableColgroup.requiredContainer = TableContainer;

TableBody.allowedChildren = [TableRow];
TableRow.requiredContainer = TableBody;

TableColgroup.allowedChildren = [TableCol];
TableCol.requiredContainer = TableColgroup;

TableRow.allowedChildren = [TableCell];
TableCell.requiredContainer = TableRow;

TableCell.allowedChildren = [TableCellBlock, TableContainer, TableHeader, ListContainer];
TableCellBlock.requiredContainer = TableCell;
TableHeader.requiredContainer = TableCell;
ListContainer.requiredContainer = TableCell;

function cellId() {
  const id = Math.random()
    .toString(36)
    .slice(2, 6);
  return `cell-${id}`;
}

function tableId() {
  const id = Math.random()
    .toString(36)
    .slice(2, 6);
  return `row-${id}`;
}

export {
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
};