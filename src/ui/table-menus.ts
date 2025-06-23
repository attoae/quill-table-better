import Quill from 'quill';
import Delta from 'quill-delta';
import type { LinkedList } from 'parchment';
import type {
  CorrectBound,
  Props,
  QuillTableBetter,
  TableCellMap,
  TableColgroup,
  TableContainer,
  TableRow,
  UseLanguageHandler
} from '../types';
import {
  createTooltip,
  getAlign,
  getCellFormats,
  getCorrectBounds,
  getComputeBounds,
  getComputeSelectedCols,
  getComputeSelectedTds,
  setElementProperty,
  getElementStyle,
  updateTableWidth
} from '../utils';
import columnIcon from '../assets/icon/column.svg';
import rowIcon from '../assets/icon/row.svg';
import mergeIcon from '../assets/icon/merge.svg';
import tableIcon from '../assets/icon/table.svg';
import cellIcon from '../assets/icon/cell.svg';
import wrapIcon from '../assets/icon/wrap.svg';
import downIcon from '../assets/icon/down.svg';
import deleteIcon from '../assets/icon/delete.svg';
import copyIcon from '../assets/icon/copy.svg';
import {
  TableCell,
  tableId
} from '../formats/table';
import TablePropertiesForm from './table-properties-form';
import {
  CELL_DEFAULT_VALUES,
  CELL_DEFAULT_WIDTH,
  CELL_PROPERTIES,
  DEVIATION,
  TABLE_PROPERTIES
} from '../config';

interface Children {
  [propName: string]: {
    content: string;
    handler: () => void;
  }
}

interface MenusDefaults {
  [propName: string]: {
    content: string;
    icon: string;
    handler: (list: HTMLUListElement, tooltip: HTMLDivElement) => void;
    children?: Children;
  }
}

enum Alignment {
  left = 'margin-left',
  right = 'margin-right'
}

function getMenusConfig(useLanguage: UseLanguageHandler, menus?: string[]): MenusDefaults {
  const DEFAULT: MenusDefaults = {
    column: {
      content: useLanguage('col'),
      icon: columnIcon,
      handler(list: HTMLUListElement, tooltip: HTMLDivElement) {
        this.toggleAttribute(list, tooltip);
      },
      children: {
        left: {
          content: useLanguage('insColL'),
          handler() {
            const { leftTd } = this.getSelectedTdsInfo();
            const bounds = this.table.getBoundingClientRect();
            this.insertColumn(leftTd, 0);
            updateTableWidth(this.table, bounds, CELL_DEFAULT_WIDTH);
            this.updateMenus();
          }
        },
        right: {
          content: useLanguage('insColR'),
          handler() {
            const { rightTd } = this.getSelectedTdsInfo();
            const bounds = this.table.getBoundingClientRect();
            this.insertColumn(rightTd, 1);
            updateTableWidth(this.table, bounds, CELL_DEFAULT_WIDTH);
            this.updateMenus();
          }
        },
        delete: {
          content: useLanguage('delCol'),
          handler() {
            this.deleteColumn();
          }
        }
      }
    },
    row: {
      content: useLanguage('row'),
      icon: rowIcon,
      handler(list: HTMLUListElement, tooltip: HTMLDivElement) {
        this.toggleAttribute(list, tooltip);
      },
      children: {
        above: {
          content: useLanguage('insRowAbv'),
          handler() {
            const { leftTd } = this.getSelectedTdsInfo();
            this.insertRow(leftTd, 0);
            this.updateMenus();
          }
        },
        below: {
          content: useLanguage('insRowBlw'),
          handler() {
            const { rightTd } = this.getSelectedTdsInfo();
            this.insertRow(rightTd, 1);
            this.updateMenus();
          }
        },
        delete: {
          content: useLanguage('delRow'),
          handler() {
            this.deleteRow();
          }
        }
      }
    },
    merge: {
      content: useLanguage('mCells'),
      icon: mergeIcon,
      handler(list: HTMLUListElement, tooltip: HTMLDivElement) {
        this.toggleAttribute(list, tooltip);
      },
      children: {
        merge: {
          content: useLanguage('mCells'),
          handler() {
            this.mergeCells();
            this.updateMenus();
          }
        },
        split: {
          content: useLanguage('sCell'),
          handler() {
            this.splitCell();
            this.updateMenus();
          }
        }
      }
    },
    table: {
      content: useLanguage('tblProps'),
      icon: tableIcon,
      handler(list: HTMLUListElement, tooltip: HTMLDivElement) {
        const attribute = {
          ...getElementStyle(this.table, TABLE_PROPERTIES),
          'align': this.getTableAlignment(this.table)
        };
        this.toggleAttribute(list, tooltip);
        this.tablePropertiesForm = new TablePropertiesForm(this, { attribute, type: 'table' });
        this.hideMenus();
      }
    },
    cell: {
      content: useLanguage('cellProps'),
      icon: cellIcon,
      handler(list: HTMLUListElement, tooltip: HTMLDivElement) {
        const { selectedTds } = this.tableBetter.cellSelection;
        const attribute =
          selectedTds.length > 1
            ? this.getSelectedTdsAttrs(selectedTds)
            : this.getSelectedTdAttrs(selectedTds[0]);
        this.toggleAttribute(list, tooltip);
        this.tablePropertiesForm = new TablePropertiesForm(this, { attribute, type: 'cell' });
        this.hideMenus();
      }
    },
    wrap: {
      content: useLanguage('insParaOTbl'),
      icon: wrapIcon,
      handler(list: HTMLUListElement, tooltip: HTMLDivElement) {
        this.toggleAttribute(list, tooltip);
      },
      children: {
        before: {
          content: useLanguage('insB4'),
          handler() {
            this.insertParagraph(-1);
          }
        },
        after: {
          content: useLanguage('insAft'),
          handler() {
            this.insertParagraph(1);
          }
        }
      }
    },
    delete: {
      content: useLanguage('delTable'),
      icon: deleteIcon,
      handler() {
        this.deleteTable();
      }
    }
  };
  const EXTRA: MenusDefaults = {
    copy: {
      content: useLanguage('copyTable'),
      icon: copyIcon,
      handler() {
        this.copyTable();
      }
    }
  };
  if (menus?.length) {
    return Object.values(menus).reduce((config: MenusDefaults, key: string) => {
      config[key] = Object.assign({}, DEFAULT, EXTRA)[key];
      return config;
    }, {});
  }
  return DEFAULT;
}

class TableMenus {
  quill: Quill;
  table: HTMLElement | null;
  root: HTMLElement;
  prevList: HTMLUListElement | null;
  prevTooltip: HTMLDivElement | null;
  scroll: boolean;
  tableBetter: QuillTableBetter;
  tablePropertiesForm: TablePropertiesForm;
  constructor(quill: Quill, tableBetter?: QuillTableBetter) {
    this.quill = quill;
    this.table = null;
    this.prevList = null;
    this.prevTooltip = null;
    this.scroll = false;
    this.tableBetter = tableBetter;
    this.tablePropertiesForm = null;
    this.quill.root.addEventListener('click', this.handleClick.bind(this));
    this.root = this.createMenus();
  }

  async copyTable() {
    if (!this.table) return;
    const tableBlot = Quill.find(this.table) as TableContainer;
    if (!tableBlot) return;
    const html = '<p><br></p>' + tableBlot.getCopyTable();
    const text = this.tableBetter.cellSelection.getText(html);
    const clipboardItem = new ClipboardItem({
      'text/html': new Blob([html], { type: 'text/html' }),
      'text/plain': new Blob([text], { type: 'text/plain' })
    });
    try {
      await navigator.clipboard.write([clipboardItem]);
      const index = this.quill.getIndex(tableBlot);
      const length = tableBlot.length();
      this.quill.setSelection(index + length, Quill.sources.SILENT);
      this.tableBetter.hideTools();
      this.quill.scrollSelectionIntoView();
    } catch (error) {
      console.error('Failed to copy table:', error);
    }
  }

  createList(children: Children) {
    if (!children) return null;
    const container = document.createElement('ul');
    for (const [key, child] of Object.entries(children)) {
      const { content, handler } = child;
      const list = document.createElement('li');
      list.innerText = content;
      list.addEventListener('click', handler.bind(this));
      list.setAttribute('data-name', key);
      container.appendChild(list);
    }
    container.classList.add('ql-table-dropdown-list', 'ql-hidden');
    return container;
  }

  createMenu(left: string, right: string, isDropDown: boolean, name: string) {
    const container = document.createElement('div');
    const dropDown = document.createElement('span');
    if (isDropDown) {
      dropDown.innerHTML = left + right;
    } else {
      dropDown.innerHTML = left;
    }
    container.classList.add('ql-table-dropdown');
    dropDown.classList.add('ql-table-tooltip-hover');
    container.appendChild(dropDown);
    container.setAttribute('data-name', name);
    return container;
  }

  createMenus() {
    const { language, options = {} } = this.tableBetter;
    const { menus } = options;
    const useLanguage = language.useLanguage.bind(language);
    const container = document.createElement('div');
    container.classList.add('ql-table-menus-container', 'ql-hidden');
    for (const [key , val] of Object.entries(getMenusConfig(useLanguage, menus))) {
      const { content, icon, children, handler } = val;
      const list = this.createList(children);
      const tooltip = createTooltip(content);
      const menu = this.createMenu(icon, downIcon, !!children, key);
      menu.appendChild(tooltip);
      list && menu.appendChild(list);
      container.appendChild(menu);
      menu.addEventListener('click', handler.bind(this, list, tooltip));
    }
    this.quill.container.appendChild(container);
    return container;
  }

  deleteColumn(isKeyboard: boolean = false) {
    const { computeBounds, leftTd, rightTd } = this.getSelectedTdsInfo();
    const bounds = this.table.getBoundingClientRect();
    const deleteTds = getComputeSelectedTds(computeBounds, this.table, this.quill.container, 'column');
    const deleteCols = getComputeSelectedCols(computeBounds, this.table, this.quill.container);
    const tableBlot = (Quill.find(leftTd) as TableCell).table();
    const { changeTds, delTds } = this.getCorrectTds(deleteTds, computeBounds, leftTd, rightTd);
    if (isKeyboard && delTds.length !== this.tableBetter.cellSelection.selectedTds.length) return;
    this.tableBetter.cellSelection.updateSelected('column');
    tableBlot.deleteColumn(changeTds, delTds, this.deleteTable.bind(this), deleteCols);
    updateTableWidth(this.table, bounds, computeBounds.left - computeBounds.right);
    this.updateMenus();
  }

  deleteRow(isKeyboard: boolean = false) {
    const selectedTds = this.tableBetter.cellSelection.selectedTds;
    const map: { [propName: string]: TableRow } = {};
    for (const td of selectedTds) {
      let rowspan = ~~td.getAttribute('rowspan') || 1;
      let row = Quill.find(td.parentElement) as TableRow;
      if (rowspan > 1) {
        while (row && rowspan) {
          const id = row.children.head.domNode.getAttribute('data-row');
          if (!map[id]) map[id] = row;
          row = row.next;
          rowspan--;
        }
      } else {
        const id = td.getAttribute('data-row');
        if (!map[id]) map[id] = row;
      }
    }
    const rows: TableRow[] = Object.values(map);
    if (isKeyboard) {
      const sum = rows.reduce((sum: number, row: TableRow) => {
        return sum += row.children.length;
      }, 0);
      if (sum !== selectedTds.length) return;
    }
    this.tableBetter.cellSelection.updateSelected('row');
    const tableBlot = (Quill.find(selectedTds[0]) as TableCell).table();
    tableBlot.deleteRow(rows, this.deleteTable.bind(this));
    this.updateMenus();
  }

  deleteTable() {
    const tableBlot = Quill.find(this.table) as TableContainer;
    if (!tableBlot) return;
    const offset = tableBlot.offset(this.quill.scroll);
    tableBlot.remove();
    this.tableBetter.hideTools();
    this.quill.setSelection(offset - 1, 0, Quill.sources.USER);
  }

  destroyTablePropertiesForm() {
    if (!this.tablePropertiesForm) return;
    this.tablePropertiesForm.removePropertiesForm();
    this.tablePropertiesForm = null;
  }

  getCellsOffset(
    computeBounds: CorrectBound,
    bounds: CorrectBound,
    leftColspan: number,
    rightColspan: number
  ) {
    const tableBlot = Quill.find(this.table) as TableContainer;
    const cells = tableBlot.descendants(TableCell);
    const _left = Math.max(bounds.left, computeBounds.left);
    const _right = Math.min(bounds.right, computeBounds.right);
    const map: TableCellMap = new Map();
    const leftMap: TableCellMap = new Map();
    const rightMap: TableCellMap = new Map();
    for (const cell of cells) {
      const { left, right } = getCorrectBounds(cell.domNode, this.quill.container);
      if (left + DEVIATION >= _left && right <= _right + DEVIATION) {
        this.setCellsMap(cell, map);
      } else if (
        left + DEVIATION >= computeBounds.left &&
        right <= bounds.left + DEVIATION
      ) {
        this.setCellsMap(cell, leftMap);
      } else if (
        left + DEVIATION >= bounds.right &&
        right <= computeBounds.right + DEVIATION
      ) {
        this.setCellsMap(cell, rightMap);
      }
    }
    return this.getDiffOffset(map) ||
      this.getDiffOffset(leftMap, leftColspan)
      + this.getDiffOffset(rightMap, rightColspan);
  }

  getColsOffset(
    colgroup: TableColgroup,
    computeBounds: CorrectBound,
    bounds: CorrectBound
  ) {
    let col = colgroup.children.head;
    const _left = Math.max(bounds.left, computeBounds.left);
    const _right = Math.min(bounds.right, computeBounds.right);
    let colLeft = null;
    let colRight = null;
    let offset = 0;
    while (col) {
      const { width } = col.domNode.getBoundingClientRect();
      if (!colLeft && !colRight) {
        const colBounds = getCorrectBounds(col.domNode, this.quill.container);
        colLeft = colBounds.left;
        colRight = colLeft + width;
      } else {
        colLeft = colRight;
        colRight += width;
      }
      if (colLeft > _right) break;
      if (colLeft >= _left && colRight <= _right) {
        offset--;
      }
      col = col.next;
    }
    return offset;
  }

  getCorrectBounds(table: HTMLElement): CorrectBound[] {
    const bounds = this.quill.container.getBoundingClientRect();
    const tableBounds = getCorrectBounds(table, this.quill.container);
    return (
      tableBounds.width >= bounds.width
       ? [{ ...tableBounds, left: 0, right: bounds.width }, bounds]
       : [tableBounds, bounds]
    );
  }

  getCorrectTds(
    deleteTds: Element[],
    computeBounds: CorrectBound,
    leftTd: Element,
    rightTd: Element
  ) {
    const changeTds: [Element, number][] = [];
    const delTds = [];
    const colgroup = (Quill.find(leftTd) as TableCell).table().colgroup() as TableColgroup;
    const leftColspan = (~~leftTd.getAttribute('colspan') || 1);
    const rightColspan = (~~rightTd.getAttribute('colspan') || 1);
    if (colgroup) {
      for (const td of deleteTds) {
        const bounds = getCorrectBounds(td, this.quill.container);
        if (
          bounds.left + DEVIATION >= computeBounds.left &&
          bounds.right <= computeBounds.right + DEVIATION
        ) {
          delTds.push(td);
        } else {
          const offset = this.getColsOffset(colgroup, computeBounds, bounds);
          changeTds.push([td, offset]);
        }
      }
    } else {
      for (const td of deleteTds) {
        const bounds = getCorrectBounds(td, this.quill.container);
        if (
          bounds.left + DEVIATION >= computeBounds.left &&
          bounds.right <= computeBounds.right + DEVIATION
        ) {
          delTds.push(td);
        } else {
          const offset = this.getCellsOffset(
            computeBounds,
            bounds,
            leftColspan,
            rightColspan
          );
          changeTds.push([td, offset]);
        }
      }
    }
    return { changeTds, delTds };
  }

  getDiffOffset(map: TableCellMap, colspan?: number) {
    let offset = 0;
    const tds = this.getTdsFromMap(map);
    if (tds.length) {
      if (colspan) {
        for (const td of tds) {
          offset += (~~td.getAttribute('colspan') || 1);
        }
        offset -= colspan;
      } else {
        for (const td of tds) {
          offset -= (~~td.getAttribute('colspan') || 1);
        }
      }
    }
    return offset;
  }

  getRefInfo(row: TableRow, right: number) {
    let ref = null;
    if (!row) return { id: tableId(), ref };
    let td = row.children.head;
    const id = td.domNode.getAttribute('data-row');
    while (td) {
      const { left } = td.domNode.getBoundingClientRect();
      if (Math.abs(left - right) <= DEVIATION) {
        return { id, ref: td };
        // The nearest cell of a multi-row cell
      } else if (Math.abs(left - right) >= DEVIATION && !ref) {
        ref = td;
      }
      td = td.next;
    }
    return { id, ref };
  }

  getSelectedTdAttrs(td: HTMLElement) {
    const cellBlot = Quill.find(td) as TableCell;
    const align = getAlign(cellBlot);
    const attr: Props =
      align
        ? { ...getElementStyle(td, CELL_PROPERTIES), 'text-align': align }
        : getElementStyle(td, CELL_PROPERTIES);
    return attr;
  }

  getSelectedTdsAttrs(selectedTds: HTMLElement[]) {
    const map = new Map();
    let attribute = null;
    for (const td of selectedTds) {
      const attr = this.getSelectedTdAttrs(td);
      if (!attribute) {
        attribute = attr;
        continue;
      }
      for (const key of Object.keys(attribute)) {
        if (map.has(key)) continue;
        if (attr[key] !== attribute[key]) {
          map.set(key, false);
        }
      }
    }
    for (const key of Object.keys(attribute)) {
      if (map.has(key)) {
        attribute[key] = CELL_DEFAULT_VALUES[key];
      }
    }
    return attribute;
  }

  getSelectedTdsInfo() {
    const { startTd, endTd } = this.tableBetter.cellSelection;
    const startCorrectBounds = getCorrectBounds(startTd, this.quill.container);
    const endCorrectBounds = getCorrectBounds(endTd, this.quill.container);
    const computeBounds = getComputeBounds(startCorrectBounds, endCorrectBounds);
    if (
      startCorrectBounds.left <= endCorrectBounds.left &&
      startCorrectBounds.top <= endCorrectBounds.top
    ) {
      return {
        computeBounds,
        leftTd: startTd,
        rightTd: endTd
      };
    }
    return {
      computeBounds,
      leftTd: endTd,
      rightTd: startTd
    };
  }

  getTableAlignment(table: HTMLTableElement) {
    const align = table.getAttribute('align');
    if (!align) {
      const {
        [Alignment.left]: left,
        [Alignment.right]: right
      } = getElementStyle(table, [Alignment.left, Alignment.right]);
      if (left === 'auto') {
        if (right === 'auto') return 'center';
        return 'right';
      }
      return 'left';
    }
    return align || 'center';
  }

  getTdsFromMap(map: TableCellMap) {
    return Object.values(Object.fromEntries(map))
    .reduce((tds: HTMLTableCellElement[], item: HTMLTableCellElement[]) => {
      return tds.length > item.length ? tds : item;
    }, []);
  }

  handleClick(e: MouseEvent) {
    if (!this.quill.isEnabled()) return;
    const table = (e.target as Element).closest('table');
    this.prevList && this.prevList.classList.add('ql-hidden');
    this.prevTooltip && this.prevTooltip.classList.remove('ql-table-tooltip-hidden');
    this.prevList = null;
    this.prevTooltip = null;
    if (!table && !this.tableBetter.cellSelection.selectedTds.length) {
      this.hideMenus();
      this.destroyTablePropertiesForm();
      return;
    } else {
      if (this.tablePropertiesForm) return;
      this.showMenus();
      this.updateMenus(table);
      if (
        (table && !table.isEqualNode(this.table)) ||
        this.scroll
      ) {
        this.updateScroll(false);
      }
      this.table = table;
    }
  }

  hideMenus() {
    this.root.classList.add('ql-hidden');
  }

  insertColumn(td: HTMLTableColElement, offset: number) {
    const { left, right, width } = td.getBoundingClientRect();
    const tdBlot = Quill.find(td) as TableCell;
    const tableBlot = tdBlot.table();
    const isLast = td.parentElement.lastChild.isEqualNode(td);
    const position = offset > 0 ? right : left;
    tableBlot.insertColumn(position, isLast, width, offset);
    this.quill.scrollSelectionIntoView();
  }

  insertParagraph(offset: number) {
    const blot = Quill.find(this.table) as TableContainer;
    const index = this.quill.getIndex(blot);
    const length = offset > 0 ? blot.length() : 0;
    const delta = new Delta()
      .retain(index + length)
      .insert('\n');
    this.quill.updateContents(delta, Quill.sources.USER);
    this.quill.setSelection(index + length, Quill.sources.SILENT);
    this.tableBetter.hideTools();
    this.quill.scrollSelectionIntoView();
  }

  insertRow(td: HTMLTableColElement, offset: number) {
    const tdBlot = Quill.find(td) as TableCell;
    const index = tdBlot.rowOffset();
    const tableBlot = tdBlot.table();
    if (offset > 0) {
      const rowspan = ~~td.getAttribute('rowspan') || 1;
      tableBlot.insertRow(index + offset + rowspan - 1, offset);
    } else {
      tableBlot.insertRow(index + offset, offset);
    }
    this.quill.scrollSelectionIntoView();
  }

  mergeCells() {
    const { selectedTds } = this.tableBetter.cellSelection;
    const { computeBounds, leftTd } = this.getSelectedTdsInfo();
    const leftTdBlot = Quill.find(leftTd) as TableCell;
    const [formats, cellId] = getCellFormats(leftTdBlot);
    const head = leftTdBlot.children.head;
    const tableBlot = leftTdBlot.table();
    const rows = tableBlot.allRows() as TableRow[];
    const row = leftTdBlot.row();
    const colspan = row.children.reduce((colspan: number, td: TableCell) => {
      const tdCorrectBounds = getCorrectBounds(td.domNode, this.quill.container);
      if (
        tdCorrectBounds.left >= computeBounds.left &&
        tdCorrectBounds.right <= computeBounds.right
      ) {
        colspan += ~~td.domNode.getAttribute('colspan') || 1;
      }
      return colspan;
    }, 0);
    const rowspan = rows.reduce((rowspan: number, row: TableRow) => {
      const rowCorrectBounds = getCorrectBounds(row.domNode, this.quill.container);
      if (
        rowCorrectBounds.top >= computeBounds.top &&
        rowCorrectBounds.bottom <= computeBounds.bottom
      ) {
        let minRowspan = Number.MAX_VALUE;
        row.children.forEach((td: TableCell) => {
          const rowspan = ~~td.domNode.getAttribute('rowspan') || 1;
          minRowspan = Math.min(minRowspan, rowspan);
        });
        rowspan += minRowspan;
      }
      return rowspan;
    }, 0);
    let offset = 0;
    for (const td of selectedTds) {
      if (leftTd.isEqualNode(td)) continue;
      const blot = Quill.find(td) as TableCell;
      blot.moveChildren(leftTdBlot);
      blot.remove();
      if (!blot.parent?.children?.length) offset++;
    }
    if (offset) {
      // Subtract the number of rows deleted by the merge
      row.children.forEach((child: TableCell) => {
        if (child.domNode.isEqualNode(leftTd)) return;
        const rowspan = child.domNode.getAttribute('rowspan');
        const [formats] = getCellFormats(child);
        // @ts-expect-error
        child.replaceWith(child.statics.blotName, { ...formats, rowspan: rowspan - offset });
      });
    }
    leftTdBlot.setChildrenId(cellId);
    leftTdBlot.replaceWith(leftTdBlot.statics.blotName, { ...formats, colspan, rowspan: rowspan - offset });
    this.tableBetter.cellSelection.setSelected(head.parent.domNode);
    this.quill.scrollSelectionIntoView();
  }

  setCellsMap(cell: TableCell, map: TableCellMap) {
    const key: string = cell.domNode.getAttribute('data-row');
    if (map.has(key)) {
      map.set(key, [...map.get(key), cell.domNode]);
    } else {
      map.set(key, [cell.domNode]);
    }
  }

  showMenus() {
    this.root.classList.remove('ql-hidden');
  }

  splitCell() {
    const { selectedTds } = this.tableBetter.cellSelection;
    const { leftTd } = this.getSelectedTdsInfo();
    const leftTdBlot = Quill.find(leftTd) as TableCell;
    const head = leftTdBlot.children.head;
    for (const td of selectedTds) {
      const colspan = ~~td.getAttribute('colspan') || 1;
      const rowspan = ~~td.getAttribute('rowspan') || 1;
      if (colspan === 1 && rowspan === 1) continue;
      const columnCells: [TableRow, string, TableCell | null][] = [];
      const { width, right } = td.getBoundingClientRect();
      const blot = Quill.find(td) as TableCell;
      const tableBlot = blot.table();
      const nextBlot = blot.next;
      const rowBlot = blot.row();
      if (rowspan > 1) {
        if (colspan > 1) {
          let nextRowBlot = rowBlot.next;
          for (let i = 1; i < rowspan; i++) {
            const { ref, id } = this.getRefInfo(nextRowBlot, right);
            for (let j = 0; j < colspan; j++) {
              columnCells.push([nextRowBlot, id, ref]);
            }
            nextRowBlot && (nextRowBlot = nextRowBlot.next);
          }
        } else {
          let nextRowBlot = rowBlot.next;
          for (let i = 1; i < rowspan; i++) {
            const { ref, id } = this.getRefInfo(nextRowBlot, right);
            columnCells.push([nextRowBlot, id, ref]);
            nextRowBlot && (nextRowBlot = nextRowBlot.next);
          }
        }
      }
      if (colspan > 1) {
        const id = td.getAttribute('data-row');
        for (let i = 1; i < colspan; i++) {
          columnCells.push([rowBlot, id, nextBlot]);
        }
      }
      for (const [row, id, ref] of columnCells) {
        tableBlot.insertColumnCell(row, id, ref);
      }
      const [formats] = getCellFormats(blot);
      blot.replaceWith(blot.statics.blotName, {
        ...formats,
        width: ~~(width / colspan),
        colspan: null,
        rowspan: null
      });
    }
    this.tableBetter.cellSelection.setSelected(head.parent.domNode);
    this.quill.scrollSelectionIntoView();
  }

  toggleAttribute(list: HTMLUListElement, tooltip: HTMLDivElement) {
    if (this.prevList && !this.prevList.isEqualNode(list)) {
      this.prevList.classList.add('ql-hidden');
      this.prevTooltip.classList.remove('ql-table-tooltip-hidden');
    }
    if (!list) return;
    list.classList.toggle('ql-hidden');
    tooltip.classList.toggle('ql-table-tooltip-hidden');
    this.prevList = list;
    this.prevTooltip = tooltip;
  }

  updateMenus(table: HTMLElement = this.table) {
    if (!table) return;
    requestAnimationFrame(() => {
      const { leftTd } = this.getSelectedTdsInfo();
      const tdBlot = Quill.find(leftTd) as TableCell;
      const insertAbove = this.root.querySelector('.ql-table-dropdown[data-name="row"] [data-name="above"]') as HTMLElement;
      const insertBelow = this.root.querySelector('.ql-table-dropdown[data-name="row"] [data-name="below"]') as HTMLElement;
      console.log('tdBlot', tdBlot.statics.blotName, { insertAbove, insertBellow: insertBelow });
      if (tdBlot.statics.blotName === 'table-head-cell') {
        // If the current cell is in the head we disable add row
        insertAbove?.style.setProperty('display', 'none');
        insertBelow?.style.setProperty('display', 'none');
      } else {
        insertAbove?.style.setProperty('display', 'block');
        insertBelow?.style.setProperty('display', 'block');
      }
      this.root.classList.remove('ql-table-triangle-none');
      const [tableBounds, containerBounds] = this.getCorrectBounds(table);
      const { left, right, top, bottom } = tableBounds;
      const { height, width } = this.root.getBoundingClientRect();
      const toolbar = this.quill.getModule('toolbar');
      // @ts-expect-error
      const computedStyle = getComputedStyle(toolbar.container);
      let correctTop = top - height - 10;
      let correctLeft = (left + right - width) >> 1;
      if (correctTop > -parseInt(computedStyle.paddingBottom)) {
        this.root.classList.add('ql-table-triangle-up');
        this.root.classList.remove('ql-table-triangle-down');
      } else {
        if (bottom > containerBounds.height) {
          correctTop = containerBounds.height + 10;
        } else {
          correctTop = bottom + 10;
        }
        this.root.classList.add('ql-table-triangle-down');
        this.root.classList.remove('ql-table-triangle-up');
      }
      if (correctLeft < containerBounds.left) {
        correctLeft = 0;
        this.root.classList.add('ql-table-triangle-none');
      } else if (correctLeft + width > containerBounds.right) {
        correctLeft = containerBounds.right - width;
        this.root.classList.add('ql-table-triangle-none');
      }
      setElementProperty(this.root, {
        left: `${correctLeft}px`,
        top: `${correctTop}px`
      });
    });
  }

  updateScroll(scroll: boolean) {
    this.scroll = scroll;
  }

  updateTable(table: HTMLElement) {
    this.table = table;
  }
}

export default TableMenus;