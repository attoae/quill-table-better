import Quill from 'quill';
import { removeElementProperty } from '../utils';

const Block = Quill.import('blots/block');
const Break = Quill.import('blots/break');
const Container = Quill.import('blots/container');

// const CELL_ATTRIBUTE = ['data-row', 'width', 'height', 'colspan', 'rowspan', 'style'];
const CELL_ATTRIBUTE = ['data-row', 'width', 'height', 'colspan', 'rowspan'];
const TABLE_ATTRIBUTE = ['border', 'cellspacing', 'style'];

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

  static formats(domNode: Element) {
    if (domNode.hasAttribute('data-cell')) {
      return domNode.getAttribute('data-cell');
    }
    // return undefined;
  }

  format(name: string, value: string | any) {
    if (name === TableCell.blotName && value) {
      // this.domNode.setAttribute('data-row', value);
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
    if (super.checkMerge()) {
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
  
  static create(value: Object) {
    const node = super.create();
    const keys = Object.keys(value);
    for (const key of keys) {
      // @ts-ignore
      node.setAttribute(key, value[key]);
    }
    return node;
  }

  static formats(domNode: HTMLElement) {
    const rowspan = this.getEmptyRowspan(domNode);
    return CELL_ATTRIBUTE.reduce((formats, attr) => {
      if (domNode.hasAttribute(attr)) {
        if (attr === 'rowspan' && rowspan) {
          // @ts-ignore
          formats[attr] = `${~~domNode.getAttribute(attr) - rowspan}`;
        } else if (attr === 'style') {
          removeElementProperty(domNode, ['width', 'height']);
          // @ts-ignore
          formats[attr] = domNode.getAttribute(attr);
        } else {
          // @ts-ignore
          formats[attr] = domNode.getAttribute(attr);
        }
      }
      return formats;
    }, {});
  }

  formats() {
    return this.statics.formats(this.domNode, this.scroll);
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

  format(name: string, value: string) {
    if (name === TableCell.blotName && value) {
      this.domNode.setAttribute('data-row', value);
    } else {
      super.format(name, value);
    }
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
    if (super.checkMerge()) {
      const thisHead = this.children.head.formats();
      const thisTail = this.children.tail.formats();
      const nextHead = this.next.children.head.formats();
      const nextTail = this.next.children.tail.formats();
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

  deleteColumn(index: number) {
    const [body] = this.descendant(TableBody);
    if (body == null || body.children.head == null) return;
    body.children.forEach((row: any) => {
      const cell = row.children.at(index);
      if (cell != null) {
        cell.remove();
      }
    });
  }

  insertColumn(index: number) {
    const [body] = this.descendant(TableBody);
    if (body == null || body.children.head == null) return;
    body.children.forEach((row: any) => {
      const ref = row.children.at(index);
      const value = TableCell.formats(row.children.head.domNode);
      const cell = this.scroll.create(TableCell.blotName, value);
      row.insertBefore(cell, ref);
    });
  }

  deleteRow(rows: TableRow[], hideMenus: () => void) {
    const [body] = this.descendant(TableBody);
    if (body == null || body.children.head == null) return;
    if (rows.length === body.children.length) {
      this.deleteTable();
      hideMenus();
    } else {
      for (const row of rows) {
        row.remove();
      }
    }
  }

  insertRow(index: number) {
    const [body] = this.descendant(TableBody);
    if (body == null || body.children.head == null) return;
    const id = tableId();
    const row = this.scroll.create(TableRow.blotName);
    const maxNum = body.children.head.children.reduce((num: number, child: any) => {
      const colspan = ~~child.domNode.getAttribute('colspan') || 1;
      return num += colspan;
    }, 0);
    for (let i = 0; i < maxNum; i++) {
      const cell = this.scroll.create(TableCell.blotName, { 'data-row': id });
      const cellBlock = this.scroll.create(TableCellBlock.blotName, i + 1);
      const empty = this.scroll.create(Break.blotName);
      cellBlock.appendChild(empty);
      cell.appendChild(cellBlock);
      row.appendChild(cell);
    }
    const ref = body.children.at(index);
    body.insertBefore(row, ref);
  }

  deleteTable() {
    this.remove();
  }
}
TableContainer.blotName = 'table-container';
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