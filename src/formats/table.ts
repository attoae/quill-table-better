import Quill from 'quill';

const Block = Quill.import('blots/block');
const Container = Quill.import('blots/container');

const CELL_ATTRIBUTES = ['data-row', 'width', 'height'];

interface TableCellBlockValue {
  row: number | string | undefined
  cell: number | string | undefined
}

class TableCellBlock extends Block {
  static create(value: TableCellBlockValue) {
    const { row, cell } = value;
    const node = super.create();
    if (row) {
      node.setAttribute('data-row', row);
    } else {
      node.setAttribute('data-row', tableId());
    }
    if (cell) {
      node.setAttribute('data-cell', cell);
    } else {
      node.setAttribute('data-cell', cellId());
    }
    return node;
  }

  // static formats(domNode: Element) {
  //   // if (domNode.hasAttribute('data-row')) {
  //   //   return domNode.getAttribute('data-row');
  //   // }
  //   // return undefined;
  //   const formats = {}

  //   if (domNode.hasAttribute('data-row')) {
  //     // @ts-ignore
  //     formats['row'] = domNode.getAttribute('data-row');
  //   }

  //   if (domNode.hasAttribute('data-cell')) {
  //     // @ts-ignore
  //     formats['cell'] = domNode.getAttribute('data-cell');
  //   }

  //   return formats;
  // }

  formats() {
    // if (this.domNode.hasAttribute('data-cell')) {
    //   return this.domNode.getAttribute('data-cell');
    // }
    const formats = {}

    if (this.domNode.hasAttribute('data-row')) {
      // @ts-ignore
      formats['row'] = this.domNode.getAttribute('data-row');
    }

    if (this.domNode.hasAttribute('data-cell')) {
      // @ts-ignore
      formats['cell'] = this.domNode.getAttribute('data-cell');
    }

    return formats;
  }

  format(name: string, value: string | any) {
    if (name === TableCellBlock.blotName && value) {
      // this.domNode.setAttribute('data-row', value.row);
      // this.domNode.setAttribute('data-cell', value.cell);
      super.format(name, value);
    } else {
      super.format(name, value);
    }
  }

  // optimize(context: any) {
  //   // cover shadowBlot's wrap call, pass params parentBlot initialize
  //   const row = this.domNode.getAttribute('data-row');
  //   if (
  //     this.statics.requiredContainer &&
  //     !(this.parent instanceof this.statics.requiredContainer)
  //   ) {
  //     this.wrap(this.statics.requiredContainer.blotName, row);
  //   }
  //   super.optimize(context);
  // }
}
TableCellBlock.blotName = 'table-cell-block';
TableCellBlock.tagName = 'P';

class TableCell extends Container {
  checkMerge() {
    if (super.checkMerge()) {
      const thisHead = this.children.head.formats();
      const thisTail = this.children.tail.formats();
      const nextHead = this.next.children.head.formats();
      const nextTail = this.next.children.tail.formats();
      // console.log(thisHead, thisTail, nextHead, nextTail)
      return (
        thisHead.cell === thisTail.cell &&
        thisHead.cell === nextHead.cell &&
        thisHead.cell === nextTail.cell
      );
    }
    return false;
  }
  
  static create(value: string | Object) {
    const node = super.create();
    if (value) {
      node.setAttribute('data-row', value);
    } else {
      node.setAttribute('data-row', tableId());
    }
    return node;
  }

  static formats(domNode: Element) {
    if (domNode.hasAttribute('data-row')) {
      return domNode.getAttribute('data-row');
    }
    return undefined;
  }

  formats() {
    if (this.domNode.hasAttribute('data-row')) {
      return this.domNode.getAttribute('data-row');
    }
    return undefined;
  }

  format(name: string, value: string) {
    if (name === TableCell.blotName && value) {
      this.domNode.setAttribute('data-row', value);
    } else {
      super.format(name, value);
    }
  }

  table() {
    let cur = this.parent;
    while (cur != null && cur.statics.blotName !== 'table-container') {
      cur = cur.parent;
    }
    return cur;
  }

  // optimize(...args: any[]) {
  //   super.optimize(...args);
  //   this.children.forEach((child: any) => {
  //     if (child.next == null) return;
  //     const childFormats = child.formats();
  //     const nextFormats = child.next.formats();
  //     if (childFormats.table !== nextFormats.table) {
  //       const next = this.splitAfter(child);
  //       if (next) {
  //         next.optimize();
  //       }
  //       // We might be able to merge with prev now
  //       if (this.prev) {
  //         this.prev.optimize();
  //       }
  //     }
  //   });
  // }
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
      // console.log(thisHead, thisTail, nextHead, nextTail)
      // return (
      //   thisHead.table === thisTail.table &&
      //   thisHead.table === nextHead.table &&
      //   thisHead.table === nextTail.table
      // );
      return (
        thisHead === thisTail &&
        thisHead === nextHead &&
        thisHead === nextTail
      );
    }
    return false;
  }

  optimize(...args: any[]) {
    super.optimize(...args);
    this.children.forEach((child: any) => {
      if (child.next == null) return;
      const childFormats = child.formats();
      const nextFormats = child.next.formats();
      if (childFormats.table !== nextFormats.table) {
        const next = this.splitAfter(child);
        if (next) {
          next.optimize();
        }
        // We might be able to merge with prev now
        if (this.prev) {
          this.prev.optimize();
        }
      }
    });
  }
}
TableRow.blotName = 'table-row';
TableRow.tagName = 'TR';

class TableCol extends Block {
  static create (value: any) {
    const node = super.create();
    return node;
  }

  // static formats(domNode: Element) {
    
  // }

  format(name: string, value: any) {
    super.format(name, value);
  }
}
TableCol.blotName = 'table-col';
TableCol.tagName = 'col';

class TableColGroup extends Container {}
TableColGroup.blotName = 'table-col-group';
TableColGroup.tagName = 'colgroup';

class TableBody extends Container {}
TableBody.blotName = 'table-body';
TableBody.tagName = 'TBODY';

class TableContainer extends Container {
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

  insertRow(index: number) {
    const [body] = this.descendant(TableBody);
    if (body == null || body.children.head == null) return;
    const id = tableId();
    const row = this.scroll.create(TableRow.blotName);
    body.children.head.children.forEach(() => {
      const cell = this.scroll.create(TableCell.blotName, id);
      row.appendChild(cell);
    });
    const ref = body.children.at(index);
    body.insertBefore(row, ref);
  }
}
TableContainer.blotName = 'table-container';
TableContainer.tagName = 'TABLE';

TableContainer.allowedChildren = [TableBody, TableColGroup];
TableBody.requiredContainer = TableContainer;
TableColGroup.requiredContainer = TableContainer;

TableColGroup.allowedChildren = [TableCol];
TableCol.requiredContainer = TableColGroup;

TableBody.allowedChildren = [TableRow];
TableRow.requiredContainer = TableBody;

TableRow.allowedChildren = [TableCell];
TableCell.requiredContainer = TableRow;

TableCell.allowedChildren = [TableCellBlock];
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
  TableCol,
  TableColGroup,
  TableBody,
  TableContainer,
  tableId
};