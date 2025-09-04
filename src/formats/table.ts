import Quill from 'quill';
import type { BlockBlot, ContainerBlot, LinkedList } from 'parchment';
import type { Props, TableCellAllowedChildren } from '../types';
import {
  filterWordStyle,
  getCellChildBlot,
  getCellFormats,
  getCellId,
  getCopyTd,
  getCorrectCellBlot
} from '../utils';
import TableHeader from './header';
import { ListContainer } from './list';
import {
  CELL_ATTRIBUTE,
  CELL_DEFAULT_WIDTH,
  DEVIATION
} from '../config';

const Block = Quill.import('blots/block') as typeof BlockBlot;
const Container = Quill.import('blots/container') as typeof ContainerBlot;
const TABLE_ATTRIBUTE = ['border', 'cellspacing', 'style', 'data-class'];
const STYLE_RULES = ['color', 'border', 'width', 'height'];
const COL_ATTRIBUTE = ['width'];

class TableCellBlock extends Block {
  static blotName = 'table-cell-block';
  static className = 'ql-table-block';
  static tagName = 'P';

  next: this | null;
  parent: TableCell;

  static create(value: string) {
    const node = super.create();
    if (value) {
      node.setAttribute('data-cell', value);
    } else {
      node.setAttribute('data-cell', cellId());
    }
    return node;
  }

  format(name: string, value: string | Props) {
    const cellId = this.formats()[this.statics.blotName];
    if (name === TableCell.blotName && value) {
      this.wrap(TableRow.blotName);
      return this.wrap(name, value);
    } else if (name === TableTh.blotName && value) {
      this.wrap(TableThRow.blotName);
      return this.wrap(name, value);
    } else if (name === TableContainer.blotName) {
      this.wrap(name, value);
    } else if (name === 'header') {
      return this.replaceWith('table-header', { cellId, value });
    } else if (name === 'table-header' && value) {
      this.wrapTableCell(this.parent);
      return this.replaceWith(name, value);
    } else if (name === 'list' || (name === 'table-list' && value)) {
      const formats = this.getCellFormats(this.parent);
      this.wrap(ListContainer.blotName, { ...formats, cellId });
      return this.replaceWith('table-list', value);
    } else {
      super.format(name, value);
    }
  }

  formats() {
    const formats = this.attributes.values();
    const format = this.domNode.getAttribute('data-cell');
    if (format != null) {
      formats[this.statics.blotName] = format;
    }
    return formats;
  }

  getCellFormats(parent: TableCell) {
    const cellBlot = getCorrectCellBlot(parent);
    if (!cellBlot) return {};
    const [formats] = getCellFormats(cellBlot);
    return formats;
  }

  wrapTableCell(parent: TableCell) {
    const cellBlot = getCorrectCellBlot(parent);
    if (!cellBlot) return;
    const [formats] = getCellFormats(cellBlot);
    this.wrap(cellBlot.statics.blotName, formats);
  }
}

class TableThBlock extends TableCellBlock {
  static blotName = 'table-th-block';
  static className = 'table-th-block';
  static tagName = 'P';

  next: this | null;
  parent: TableTh;
}

class TableCell extends Container {
  static blotName = 'table-cell';
  static tagName = 'TD';

  children: LinkedList<TableCellBlock | TableHeader | ListContainer>;
  next: this | null;
  parent: TableRow;
  prev: this | null;

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
      const _thisHead = getCellId(thisHead);
      const _thisTail = getCellId(thisTail);
      const _nextHead = getCellId(nextHead);
      const _nextTail = getCellId(nextTail);
      return (
        _thisHead === _thisTail &&
        _thisHead === _nextHead &&
        _thisHead === _nextTail
      );
    }
    return false;
  }
  
  static create(value: Props) {
    const node = super.create() as HTMLElement;
    const keys = Object.keys(value);
    for (const key of keys) {
      value[key] && node.setAttribute(key, value[key]);
    }
    return node;
  }

  static formats(domNode: Element) {
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
    if (this.hasColgroup(domNode)) {
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
    while (
      nextNode &&
      nextNode.tagName === 'TR' &&
      !nextNode.innerHTML.replace(/\s/g, '')
    ) {
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

  setChildrenId(cellId: string) {
    this.children.forEach((child: TableCellBlock | ListContainer | TableHeader) => {
      child.domNode.setAttribute('data-cell', cellId);
    });
  }

  table(): TableContainer {
    let cur = this.parent;
    while (cur != null && cur.statics.blotName !== 'table-container') {
      // @ts-expect-error
      cur = cur.parent;
    }
    // @ts-expect-error
    return cur;
  }

  optimize(context?: unknown) {
    super.optimize(context);
    
    this.children.forEach((child: TableCellAllowedChildren) => {
      if (child.next == null) return;
      const childFormats = getCellId(child.formats()[child.statics.blotName]);
      const nextFormats = getCellId(child.next.formats()[child.next.statics.blotName]);
      if (childFormats !== nextFormats) {
        const next = this.splitAfter(child);
        // @ts-expect-error
        if (next) next.optimize();
        // We might be able to merge with prev now
        if (this.prev) this.prev.optimize();
      }
    });
  }
}

class TableTh extends TableCell {
  static blotName = 'table-th';
  static tagName = 'TH';

  children: LinkedList<TableThBlock | TableHeader | ListContainer>;
  next: this | null;
  parent: TableThRow;
  prev: this | null;
}

class TableRow extends Container {
  static blotName = 'table-row';
  static tagName = 'TR';

  children: LinkedList<TableCell>;
  next: this | null;
  parent: TableBody;
  prev: this | null;

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

class TableThRow extends TableRow {
  static blotName = 'table-th-row';
  static tagName = 'TR';

  children: LinkedList<TableTh>;
  next: this | null;
  parent: TableThead;
  prev: this | null;
}

class TableBody extends Container {
  static blotName = 'table-body';
  static tagName = 'TBODY';

  children: LinkedList<TableRow>;
  next: this | null;
  parent: TableContainer;
}

class TableThead extends TableBody {
  static blotName = 'table-thead';
  static tagName = 'THEAD';

  children: LinkedList<TableThRow>;
  next: this | null;
  parent: TableContainer;
}

class TableTemporary extends Block {
  static blotName = 'table-temporary';
  static className = 'ql-table-temporary';
  static tagName = 'temporary';

  next: this | null;

  static create(value: Props) {
    const node = super.create();
    const keys = Object.keys(value);
    const className = TableContainer.defaultClassName;
    for (const key of keys) {
      if (key === 'data-class' && !~value[key].indexOf(className)) {
        node.setAttribute(key, `${className} ${value[key]}`);
      } else {
        node.setAttribute(key, value[key]);
      }
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
          if (key === 'data-class') {
            this.parent.domNode.setAttribute('class', formats[key]);
          } else {
            this.parent.domNode.setAttribute(key, formats[key]);
          }
        } else {
          this.parent.domNode.removeAttribute(key);
        }
      }
    }
    super.optimize(...args);
  }
}

class TableCol extends Block {
  static blotName = 'table-col';
  static tagName = 'COL';

  next: this | null;

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

class TableColgroup extends Container {
  static blotName = 'table-colgroup';
  static tagName = 'COLGROUP';

  children: LinkedList<TableCol>;
  next: this | null;
}

class TableContainer extends Container {
  static blotName = 'table-container';
  static defaultClassName = 'ql-table-better';
  static tagName = 'TABLE';

  children: LinkedList<TableBody | TableTemporary | TableColgroup>;
  
  colgroup() {
    // @ts-expect-error
    const [colgroup] = this.descendant(TableColgroup);
    return colgroup || this.findChild('table-colgroup') as TableColgroup;
  }

  deleteColumn(
    changeTds: [Element, number][],
    delTds: Element[],
    deleteTable: () => void,
    cols: Element[] = []
  ) {
    const body = this.tbody();
    const tableCells = this.descendants(TableCell);
    if (body == null || body.children.head == null) return;
    if (delTds.length === tableCells.length) {
      deleteTable();
    } else {
      for (const [td, offset] of changeTds) {
        this.setCellColspan(Quill.find(td) as TableCell, offset);
      }
      for (const td of [...delTds, ...cols]) {
        if (td.parentElement.children.length === 1) {
          this.setCellRowspan(td.parentElement.previousElementSibling);
        }
        td.remove();
      }
    }
  }

  deleteRow(rows: TableRow[], deleteTable: () => void) {
    const body = this.tbody();
    if (body == null || body.children.head == null) return;
    if (rows.length === body.children.length) {
      deleteTable();
    } else {
      const weakMap: WeakMap<TableCell, { next: TableRow, rowspan: number }> = new WeakMap();
      const columnCells: [TableRow, Props, TableCell | null, TableCell | null][] = [];
      const keys: TableCell[] = [];
      const maxColumns = this.getMaxColumns(body.children.head.children);
      for (const row of rows) {
        const prev = this.getCorrectRow(row, maxColumns);
        prev && prev.children.forEach((child: TableCell) => {
          const rowspan = ~~child.domNode.getAttribute('rowspan') || 1;
          if (rowspan > 1) {
            const blotName = child.statics.blotName;
            const [formats] = getCellFormats(child);
            if (rows.includes(child.parent)) {
              const next = child.parent?.next;
              if (weakMap.has(child)) {
                const { rowspan } = weakMap.get(child);
                weakMap.set(child, { next, rowspan: rowspan - 1 });
              } else {
                weakMap.set(child, { next, rowspan: rowspan - 1 });
                keys.push(child);
              }
            } else {
              child.replaceWith(blotName, { ...formats, rowspan: rowspan - 1 });
            }
          }
        });
      }
      for (const prev of keys) {
        const [formats] = getCellFormats(prev);
        const { right: position, width } = prev.domNode.getBoundingClientRect();
        const { next, rowspan } = weakMap.get(prev);
        this.setColumnCells(next, columnCells, { position, width }, formats, rowspan, prev);
      }
      for (const [row, formats, ref, prev] of columnCells) {
        const cell = this.scroll.create(TableCell.blotName, formats) as TableCell;
        prev.moveChildren(cell);
        const _cellId = cellId();
        cell.setChildrenId(_cellId);
        row.insertBefore(cell, ref);
        prev.remove();
      }
      for (const row of rows) {
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

  getCopyTable(html: string = this.domNode.outerHTML) {
    return html
      .replace(/<temporary[^>]*>(.*?)<\/temporary>/gi, '')
      .replace(/<td[^>]*>(.*?)<\/td>/gi, ($1: string) => {
        return getCopyTd($1);
      });
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

  getInsertRow(prev: TableRow, ref: TableRow | null, offset: number, isTh?: boolean) {
    const body = this.tbody();
    const thead = this.thead();
    if (
      (body == null || body.children.head == null) &&
      (thead == null || thead.children.head == null)
    ) return;
    const id = tableId();
    const blotName = isTh ? TableThRow.blotName : TableRow.blotName;
    const row = this.scroll.create(blotName) as TableRow;
    const maxColumns = this.getMaxColumns((body || thead).children.head.children);
    const nextMaxColumns = this.getMaxColumns(prev.children);
    if (nextMaxColumns === maxColumns) {
      prev.children.forEach((child: TableCell) => {
        const formats = { height: '24', 'data-row': id };
        const colspan = ~~child.domNode.getAttribute('colspan') || 1;
        this.insertTableCell(colspan, formats, row, isTh);
      });
      return row;
    } else {
      const correctRow = this.getCorrectRow(prev.prev, maxColumns);
      correctRow.children.forEach((child: TableCell) => {
        const formats = { height: '24', 'data-row': id };
        const colspan = ~~child.domNode.getAttribute('colspan') || 1;
        const rowspan = ~~child.domNode.getAttribute('rowspan') || 1;
        if (rowspan > 1) {
          if (offset > 0 && !ref) {
            this.insertTableCell(colspan, formats, row, isTh);
          } else {
            const [formats] = getCellFormats(child);
            child.replaceWith(child.statics.blotName, {
              ...formats,
              rowspan: rowspan + 1
            });
          }
        } else {
          this.insertTableCell(colspan, formats, row, isTh);
        }
      });
      return row;
    }
  }

  getMaxColumns(children: LinkedList<TableCell>) {
    return children.reduce((num: number, child: TableCell) => {
      const colspan = ~~child.domNode.getAttribute('colspan') || 1;
      return num += colspan;
    }, 0);
  }

  insertColumn(position: number, isLast: boolean, w: number, offset: number) {
    const colgroup = this.colgroup() as TableColgroup;
    const body = this.tbody() as TableBody;
    const thead = this.thead() as TableThead;
    if (
      (body == null || body.children.head == null) &&
      (thead == null || thead.children.head == null)
    ) return;
    const columnCells: [TableRow, string, TableCell | null, null][] = [];
    const cols: [TableColgroup, TableCol | null][] = [];
    const rows = this.descendants(TableRow);
    for (const row of rows) {
      if (isLast && offset > 0) {
        const id = row.children.tail.domNode.getAttribute('data-row');
        columnCells.push([row, id, null, null]);
      } else {
        this.setColumnCells(row, columnCells, { position, width: w });
      }
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
          if (Math.abs(correctLeft - position) <= DEVIATION) {
            cols.push([colgroup, col]);
            break;
          } else if (Math.abs(correctRight - position) <= DEVIATION && !col.next) {
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

  insertColumnCell(row: TableRow | TableThRow, id: string, ref: TableCell | TableTh) {
    if (!row) {
      const tbody = this.tbody();
      row = this.scroll.create(TableRow.blotName) as TableRow;
      tbody.insertBefore(row, null);
    }
    const colgroup = this.colgroup();
    const formats = colgroup ? { 'data-row': id } : { 'data-row': id, width: `${CELL_DEFAULT_WIDTH}` };
    const isTableRow = row.statics.blotName === TableRow.blotName;
    const cellBlotName = isTableRow ? TableCell.blotName : TableTh.blotName;
    const blockBlotName = isTableRow ? TableCellBlock.blotName : TableThBlock.blotName;
    const cell = this.scroll.create(cellBlotName, formats) as TableCell;
    const cellBlock = this.scroll.create(blockBlotName, cellId()) as TableCellBlock;
    cell.appendChild(cellBlock);
    row.insertBefore(cell, ref);
    cellBlock.optimize();
    return cell;
  }

  insertRow(index: number, offset: number, isTh?: boolean) {
    const body = this.tbody() as TableBody;
    const thead = this.thead() as TableThead;
    if (
      (body == null || body.children.head == null) &&
      (thead == null || thead.children.head == null)
    ) return;
    const parent = isTh ? thead : body;
    const ref = isTh ? thead.children.at(index) : body.children.at(index);
    const prev = ref ? ref : body.children.at(index - 1);
    const correctRow = this.getInsertRow(prev, ref, offset, isTh);
    parent.insertBefore(correctRow, ref);
  }

  insertTableCell(colspan: number, formats: Props, row: TableRow, isTh?: boolean) {
    if (colspan > 1) {
      Object.assign(formats, { colspan });
    } else {
      delete formats['colspan'];
    }
    const cellBlotName = isTh ? TableTh.blotName : TableCell.blotName;
    const blockBlotName = isTh ? TableThBlock.blotName : TableCellBlock.blotName;
    const cell = this.scroll.create(cellBlotName, formats) as TableCell;
    const cellBlock = this.scroll.create(blockBlotName, cellId()) as TableCellBlock;
    cell.appendChild(cellBlock);
    row.appendChild(cell);
    cellBlock.optimize();
  }

  isPercent() {
    const width =
      this.domNode.getAttribute('width') ||
      this.domNode.style.getPropertyValue('width');
    if (!width) return false;
    return width.endsWith('%');
  }

  optimize(context: unknown) {
    super.optimize(context);
    const temporaries = this.descendants(TableTemporary);
    this.setClassName(temporaries);
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
    if (colspan > 1) {
      Object.assign(formats, { colspan });
    } else {
      delete formats['colspan'];
    }
    cell.replaceWith(blotName, formats);
  }

  setCellRowspan(parentElement: Element) {
    while (parentElement) {
      const children = parentElement.querySelectorAll('td[rowspan]');
      if (children.length) {
        for (const child of children) {
          const cell = Quill.find(child) as TableCell;
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

  private setClassName(temporaries: TableTemporary[]) {
    const defaultClassName = this.statics.defaultClassName;
    const _temporary = temporaries[0];
    const _className = this.domNode.getAttribute('class');
    const getClassName = (className: string) => {
      const classNames = (className || '').split(/\s+/);
      if (!classNames.find(className => className === defaultClassName)) {
        classNames.unshift(defaultClassName);
      }
      return classNames.join(' ').trim();
    }
    const setClass = (temporary: TableTemporary, _className: string) => {
      const className = temporary.domNode.getAttribute('data-class');
      if (className !== _className && _className != null) {
        temporary.domNode.setAttribute('data-class', getClassName(_className));
      }
      if (!_className && !className) {
        temporary.domNode.setAttribute('data-class', defaultClassName);
      }
    }
    if (!_temporary) {
      const container = this.prev;
      if (!container) return;
      // @ts-expect-error
      const [cell] = container.descendant(TableCell);
      // @ts-expect-error
      const [temporary] = container.descendant(TableTemporary);
      if (!cell && temporary) {
        setClass(temporary, _className);
      }
    } else {
      setClass(_temporary, _className);
    }
  }

  private setColumnCells(
    row: TableRow,
    columnCells: [TableRow, Props | string, TableCell, TableCell][],
    bounds: { position: number, width: number },
    formats?: Props,
    rowspan?: number,
    prev?: TableCell
  ) {
    if (!row) return;
    const { position, width } = bounds;
    let ref = row.children.head;
    while (ref) {
      const { left, right } = ref.domNode.getBoundingClientRect();
      const id: string = ref.domNode.getAttribute('data-row');
      if (typeof formats === 'object') {
        Object.assign(formats, { rowspan, 'data-row': id });
      }
      const props = formats || id;
      if (Math.abs(left - position) <= DEVIATION) {
        columnCells.push([row, props, ref, prev]);
        break;
      } else if (Math.abs(right - position) <= DEVIATION && !ref.next) {
        columnCells.push([row, props, null, prev]);
        break;
      // rowspan > 1 (insertLeft, position + w is left)
      } else if (Math.abs(left - position - width) <= DEVIATION) {
        columnCells.push([row, props, ref, prev]);
        break;
      // rowspan > 1 (position between left and right, rowspan++)
      } else if (position > left && position < right) {
        columnCells.push([null, props, ref, prev]);
        break;
      }
      ref = ref.next;
    }
  }

  tbody() {
    // @ts-expect-error
    const [body] = this.descendant(TableBody);
    return body || this.findChild('table-body') as TableBody;
  }

  temporary() {
    // @ts-expect-error
    const [temporary] = this.descendant(TableTemporary);
    return temporary;
  }

  thead() {
    // @ts-expect-error
    const [thead] = this.descendant(TableThead);
    return thead || this.findChild('table-thead') as TableThead;
  }
}

TableContainer.allowedChildren = [TableBody, TableThead, TableTemporary, TableColgroup];
TableBody.requiredContainer = TableContainer;
TableThead.requiredContainer = TableContainer;
TableTemporary.requiredContainer = TableContainer;
TableColgroup.requiredContainer = TableContainer;

TableBody.allowedChildren = [TableRow];
TableRow.requiredContainer = TableBody;
TableThead.allowedChildren = [TableThRow];
TableThRow.requiredContainer = TableThead;

TableColgroup.allowedChildren = [TableCol];
TableCol.requiredContainer = TableColgroup;

TableRow.allowedChildren = [TableCell];
TableCell.requiredContainer = TableRow;
TableThRow.allowedChildren = [TableTh];
TableTh.requiredContainer = TableThRow;

TableCell.allowedChildren = [TableCellBlock, TableHeader, ListContainer];
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
};