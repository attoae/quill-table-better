import Quill from 'quill';
import { removeElementProperty } from '../utils';

const Block = Quill.import('blots/block');
const Break = Quill.import('blots/break');
const Container = Quill.import('blots/container');

const CELL_ATTRIBUTE = ['data-row', 'width', 'height', 'colspan', 'rowspan', 'style'];
// const CELL_ATTRIBUTE = ['data-row', 'width', 'height', 'colspan', 'rowspan'];
const TABLE_ATTRIBUTE = ['border', 'cellspacing', 'style'];

interface BlotValue {
  [propName: string]: any
}

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

  formats() {
    return { [this.statics.blotName]: this.domNode.getAttribute('data-cell') };
  }

  format(name: string, value: string | any) {
    if (name === TableCell.blotName && value) {
      this.wrap(TableRow.blotName);
      this.wrap(name, value);
    } else if (name === TableContainer.blotName) {
      this.wrap(name, value);
    } else {
      super.format(name, value);
    }
  }
}
TableCellBlock.blotName = 'table-cell-block';
TableCellBlock.className = 'ql-table-block';
TableCellBlock.tagName = 'P';

class TableCell extends Container {
  checkMerge() {
    if (super.checkMerge() && this.next.children.head != null) {
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
  
  static create(value: BlotValue) {
    const node = super.create();
    const keys = Object.keys(value);
    for (const key of keys) {
      value[key] && node.setAttribute(key, value[key]);
    }
    return node;
  }

  static formats(domNode: HTMLElement) {
    const rowspan = this.getEmptyRowspan(domNode);
    return CELL_ATTRIBUTE.reduce((formats: BlotValue, attr) => {
      if (domNode.hasAttribute(attr)) {
        if (attr === 'rowspan' && rowspan) {
          formats[attr] = `${~~domNode.getAttribute(attr) - rowspan}`;
        } else {
          formats[attr] = domNode.getAttribute(attr);
        }
      }
      return formats;
    }, {});
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
}
TableCell.blotName = 'table';
TableCell.tagName = 'TD';

class TableRow extends Container {
  checkMerge() {
    if (super.checkMerge() && this.next.children.head != null) {
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

class TableContainer extends Container {
  // static create(value: Object) {
  //   const node = super.create();
  //   const keys = Object.keys(value);
  //   for (const key of keys) {
  //     // @ts-ignore
  //     node.setAttribute(key, value[key]);
  //   }
  //   return node;
  // }

  // static formats(domNode: Element) {
  //   return TABLE_ATTRIBUTE.reduce((formats, attr) => {
  //     if (domNode.hasAttribute(attr)) {
  //       // @ts-ignore
  //       formats[attr] = domNode.getAttribute(attr);
  //     }
  //     return formats;
  //   }, {});
  // }

  // formats() {
  //   return this.statics.formats(this.domNode, this.scroll);
  // }

  balanceCells() {
    const rows = this.descendants(TableRow);
    const maxColumns = rows.reduce((max: number, row: any) => {
      return Math.max(row.children.length, max);
    }, 0);
    rows.forEach((row: any) => {
      new Array(maxColumns - row.children.length).fill(0).forEach(() => {
        let value;
        if (row.children.head != null) {
          value = TableCell.formats(row.children.head.domNode);
        }
        const blot = this.scroll.create(TableCell.blotName, value);
        row.appendChild(blot);
        blot.optimize(); // Add break blot
      });
    });
  }

  deleteColumn(cells: Element[], hideMenus: () => void) {
    const [body] = this.descendant(TableBody);
    const tableCells = this.descendants(TableCell); 
    if (body == null || body.children.head == null) return;
    if (cells.length === tableCells.length) {
      this.deleteTable();
      hideMenus();
    } else {
      for (const td of cells) {
        td.remove();
      }
    }
  }

  insertColumn(position: number, isLast?: boolean) {
    const [body] = this.descendant(TableBody);
    if (body == null || body.children.head == null) return;
    body.children.forEach((row: TableRow) => {
      if (isLast) {
        const id = row.children.tail.domNode.getAttribute('data-row');
        this.insertColumnCell(row, id, null);
        return;
      } else {
        row.children.forEach((ref: TableCell) => {
          const { left, right } = ref.domNode.getBoundingClientRect();
          const id = ref.domNode.getAttribute('data-row');
          if (Math.abs(left - position) <= 2) {
            this.insertColumnCell(row, id, ref);
            return;
          } else if (Math.abs(right - position) <= 2 && !ref.next) {
            this.insertColumnCell(row, id, null);
            return;
          }
        });
      }
    });
  }

  insertColumnCell(row: TableRow, id: string, ref: TableCell | null) {
    const cell = this.scroll.create(TableCell.blotName, { 'data-row': id, width: '72' });
    const cellBlock = this.scroll.create(TableCellBlock.blotName, cellId());
    cell.appendChild(cellBlock);
    row.insertBefore(cell, ref);
    cellBlock.optimize();
  }

  deleteRow(rows: TableRow[], hideMenus: () => void) {
    const [body] = this.descendant(TableBody);
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

  insertRow(index: number, offset: number) {
    const [body] = this.descendant(TableBody);
    if (body == null || body.children.head == null) return;
    const ref = body.children.at(index);
    const prev = ref ? ref : body.children.at(index - 1);
    const correctRow = this.getInsertRow(prev, offset);
    body.insertBefore(correctRow, ref);
  }

  getInsertRow(prev: TableRow, offset: number) {
    const [body] = this.descendant(TableBody);
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

  insertTableCell(colspan: number, formats: { [propName: string]: string }, row: TableRow) {
    if (colspan > 1) {
      Object.assign(formats, { colspan });
    }
    const cell = this.scroll.create(TableCell.blotName, formats);
    const cellBlock = this.scroll.create(TableCellBlock.blotName, cellId());
    cell.appendChild(cellBlock);
    row.appendChild(cell);
    cellBlock.optimize();
  }

  getMaxColumns(children: TableCell[]) {
    return children.reduce((num: number, child: TableCell) => {
      const colspan = ~~child.domNode.getAttribute('colspan') || 1;
      return num += colspan;
    }, 0);
  }

  deleteTable() {
    this.remove();
  }
}
TableContainer.blotName = 'table-container';
TableContainer.className = 'ql-table-better';
TableContainer.tagName = 'TABLE';

TableContainer.allowedChildren = [TableBody];
TableBody.requiredContainer = TableContainer;

TableBody.allowedChildren = [TableRow];
TableRow.requiredContainer = TableBody;

TableRow.allowedChildren = [TableCell];
TableCell.requiredContainer = TableRow;

TableCell.allowedChildren = [TableCellBlock, TableContainer];
TableCellBlock.requiredContainer = TableCell;

function tableId() {
  const id = Math.random()
    .toString(36)
    .slice(2, 6);
  return `row-${id}`;
}

function cellId() {
  const id = Math.random()
    .toString(36)
    .slice(2, 6);
  return `cell-${id}`;
}

export {
  TableCellBlock,
  TableCell,
  TableRow,
  TableBody,
  TableContainer,
  tableId
};