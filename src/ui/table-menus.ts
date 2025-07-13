import Quill from 'quill';
import Delta from 'quill-delta';
import merge from 'lodash.merge';
import type { LinkedList } from 'parchment';
import type {
  CorrectBound,
  Props,
  QuillTableBetter,
  TableCellMap,
  TableColgroup,
  TableContainer,
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
  tableId,
  TableTh,
  TableRow,
  TableThRow,
  TableThead
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
    divider?: boolean;
    createSwitch?: boolean;
  }
}

interface Menu {
  content: string;
  icon: string;
  handler: (list: HTMLUListElement, tooltip: HTMLDivElement) => void;
  children?: Children;
}

interface CustomMenu extends Menu {
  name: 'column' | 'row' | 'merge' | 'table' | 'cell' | 'wrap' | 'delete' | 'copy';
}

interface MenusDefaults {
  [propName: string]: Menu
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
        },
        select: {
          content: useLanguage('selCol'),
          handler() {
            this.selectColumn();
          }
        }
      }
    },
    row: {
      content: useLanguage('row'),
      icon: rowIcon,
      handler(list: HTMLUListElement, tooltip: HTMLDivElement, e?: PointerEvent) {
        this.toggleAttribute(list, tooltip, e);
      },
      children: {
        header: {
          content: useLanguage('headerRow'),
          divider: true,
          createSwitch: true,
          handler() {
            this.toggleHeaderRow();
            this.toggleHeaderRowSwitch();
          }
        },
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
        },
        select: {
          content: useLanguage('selRow'),
          handler() {
            this.selectRow();
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
    return Object.values(menus).reduce((config: MenusDefaults, menu: string | CustomMenu) => {
      const ALL_MENUS = Object.assign({}, DEFAULT, EXTRA);
      if (typeof menu === 'string') {
        config[menu] = ALL_MENUS[menu];
      }
      if (menu != null && typeof menu === 'object' && menu.name) {
        config[menu.name] = merge(ALL_MENUS[menu.name], menu);
      }
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
  tableHeaderRow: HTMLElement | null;
  constructor(quill: Quill, tableBetter?: QuillTableBetter) {
    this.quill = quill;
    this.table = null;
    this.prevList = null;
    this.prevTooltip = null;
    this.scroll = false;
    this.tableBetter = tableBetter;
    this.tablePropertiesForm = null;
    this.tableHeaderRow = null;
    this.quill.root.addEventListener('click', this.handleClick.bind(this));
    this.root = this.createMenus();
  }

  convertToRow() {
    const tableBlot = Quill.find(this.table) as TableContainer;
    const tbody = tableBlot.tbody();
    const ref = tbody.children.head;
    const rows = this.getCorrectRows();
    let row = rows[0].next;
    while (row) {
      rows.unshift(row);
      row = row.next;
    }
    for (const row of rows) {
      const tdRow = this.quill.scroll.create(TableRow.blotName) as TableRow;
      row.children.forEach(th => {
        const tdFormats = th.formats()[th.statics.blotName];
        const domNode = th.domNode.cloneNode(true);
        const td = this.quill.scroll.create(domNode).replaceWith(TableCell.blotName, tdFormats);
        tdRow.insertBefore(td, null);
      });
      tbody.insertBefore(tdRow, ref);
      row.remove();
    }
    // @ts-expect-error
    const [td] = tbody.descendant(TableCell);
    this.tableBetter.cellSelection.setSelected(td.domNode);
  }

  convertToHeaderRow() {
    const tableBlot = Quill.find(this.table) as TableContainer;
    let thead = tableBlot.thead();
    if (!thead) {
      const tbody = tableBlot.tbody();
      thead = this.quill.scroll.create(TableThead.blotName) as TableThead;
      tableBlot.insertBefore(thead, tbody);
    }
    const rows = this.getCorrectRows();
    let row = rows[0].prev;
    while (row) {
      rows.unshift(row);
      row = row.prev;
    }
    for (const row of rows) {
      const thRow = this.quill.scroll.create(TableThRow.blotName) as TableThRow;
      row.children.forEach(td => {
        const tdFormats = td.formats()[td.statics.blotName];
        const domNode = td.domNode.cloneNode(true);
        const th = this.quill.scroll.create(domNode).replaceWith(TableTh.blotName, tdFormats);
        thRow.insertBefore(th, null);
      });
      thead.insertBefore(thRow, null);
      row.remove();
    }
    // @ts-expect-error
    const [th] = thead.descendant(TableTh);
    this.tableBetter.cellSelection.setSelected(th.domNode);
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
    for (const [, child] of Object.entries(children)) {
      const { content, divider, createSwitch, handler } = child;
      const list = document.createElement('li');
      if (createSwitch) {
        list.classList.add('ql-table-header-row');
        list.appendChild(this.createSwitch(content));
        this.tableHeaderRow = list;
      } else {
        list.innerText = content;
      }
      list.addEventListener('click', handler.bind(this));
      container.appendChild(list);
      if (divider) {
        const dividerLine = document.createElement('li');
        dividerLine.classList.add('ql-table-divider');
        container.appendChild(dividerLine);
      }
    }
    container.classList.add('ql-table-dropdown-list', 'ql-hidden');
    return container;
  }

  createMenu(left: string, right: string, isDropDown: boolean, category: string) {
    const container = document.createElement('div');
    const dropDown = document.createElement('span');
    if (isDropDown) {
      dropDown.innerHTML = left + right;
    } else {
      dropDown.innerHTML = left;
    }
    container.classList.add('ql-table-dropdown');
    dropDown.classList.add('ql-table-tooltip-hover');
    container.setAttribute('data-category', category);
    container.appendChild(dropDown);
    return container;
  }

  createMenus() {
    const { language, options = {} } = this.tableBetter;
    const { menus } = options;
    const useLanguage = language.useLanguage.bind(language);
    const container = document.createElement('div');
    container.classList.add('ql-table-menus-container', 'ql-hidden');
    for (const [category, val] of Object.entries(getMenusConfig(useLanguage, menus))) {
      const { content, icon, children, handler } = val;
      const list = this.createList(children);
      const tooltip = createTooltip(content);
      const menu = this.createMenu(icon, downIcon, !!children, category);
      menu.appendChild(tooltip);
      list && menu.appendChild(list);
      container.appendChild(menu);
      menu.addEventListener('click', handler.bind(this, list, tooltip));
    }
    this.quill.container.appendChild(container);
    return container;
  }

  createSwitch(content: string) {
    const fragment = document.createDocumentFragment();
    const title = document.createElement('span');
    const switchContainer = document.createElement('span');
    const switchInner = document.createElement('span');
    title.innerText = content;
    switchContainer.classList.add('ql-table-switch');
    switchInner.classList.add('ql-table-switch-inner');
    switchInner.setAttribute('aria-checked', 'false');
    switchContainer.appendChild(switchInner);
    fragment.append(title, switchContainer);
    return fragment;
  }

  deleteColumn(isKeyboard: boolean = false) {
    const { computeBounds, leftTd, rightTd } = this.getSelectedTdsInfo();
    const bounds = this.table.getBoundingClientRect();
    const selectTds = getComputeSelectedTds(computeBounds, this.table, this.quill.container, 'column');
    const deleteCols = getComputeSelectedCols(computeBounds, this.table, this.quill.container);
    const tableBlot = (Quill.find(leftTd) as TableCell).table();
    const { changeTds, selTds } = this.getCorrectTds(selectTds, computeBounds, leftTd, rightTd);
    if (isKeyboard && selTds.length !== this.tableBetter.cellSelection.selectedTds.length) return;
    this.tableBetter.cellSelection.updateSelected('column');
    tableBlot.deleteColumn(changeTds, selTds, this.deleteTable.bind(this), deleteCols);
    updateTableWidth(this.table, bounds, computeBounds.left - computeBounds.right);
    this.updateMenus();
  }

  deleteRow(isKeyboard: boolean = false) {
    const selectedTds = this.tableBetter.cellSelection.selectedTds;
    const rows = this.getCorrectRows();
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

  disableMenu(category: string, disabled?: boolean) {
    if (!this.root) return;
    const menu = this.root.querySelector(`[data-category=${category}]`);
    if (!menu) return;
    if (disabled) {
      menu.classList.add('ql-table-disabled');
    } else {
      menu.classList.remove('ql-table-disabled');
    }
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
    selectTds: Element[],
    computeBounds: CorrectBound,
    leftTd: Element,
    rightTd: Element
  ) {
    const changeTds: [Element, number][] = [];
    const selTds = [];
    const colgroup = (Quill.find(leftTd) as TableCell).table().colgroup() as TableColgroup;
    const leftColspan = (~~leftTd.getAttribute('colspan') || 1);
    const rightColspan = (~~rightTd.getAttribute('colspan') || 1);
    if (colgroup) {
      for (const td of selectTds) {
        const bounds = getCorrectBounds(td, this.quill.container);
        if (
          bounds.left + DEVIATION >= computeBounds.left &&
          bounds.right <= computeBounds.right + DEVIATION
        ) {
          selTds.push(td);
        } else {
          const offset = this.getColsOffset(colgroup, computeBounds, bounds);
          changeTds.push([td, offset]);
        }
      }
    } else {
      for (const td of selectTds) {
        const bounds = getCorrectBounds(td, this.quill.container);
        if (
          bounds.left + DEVIATION >= computeBounds.left &&
          bounds.right <= computeBounds.right + DEVIATION
        ) {
          selTds.push(td);
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
    return { changeTds, selTds };
  }

  getCorrectRows() {
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
    return Object.values(map);
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
    if (table && !this.quill.root.contains(table)) return;
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
    const isTh = tdBlot.statics.blotName === TableTh.blotName;
    if (offset > 0) {
      const rowspan = ~~td.getAttribute('rowspan') || 1;
      tableBlot.insertRow(index + offset + rowspan - 1, offset, isTh);
    } else {
      tableBlot.insertRow(index + offset, offset, isTh);
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
    const rows = tableBlot.tbody().children as LinkedList<TableRow>;
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
    // @ts-expect-error
    head.format(leftTdBlot.statics.blotName, { ...formats, colspan, rowspan: rowspan - offset });
    this.tableBetter.cellSelection.setSelected(head.parent.domNode);
    this.quill.scrollSelectionIntoView();
  }

  selectColumn() {
    const { computeBounds, leftTd, rightTd } = this.getSelectedTdsInfo();
    const selectTds = getComputeSelectedTds(computeBounds, this.table, this.quill.container, 'column');
    const { selTds } = this.getCorrectTds(selectTds, computeBounds, leftTd, rightTd);
    this.tableBetter.cellSelection.setSelectedTds(selTds);
    this.updateMenus();
  }

  selectRow() {
    const rows = this.getCorrectRows();
    const selectTds = rows.reduce((selTds: Element[], row: TableRow) => {
      selTds.push(...Array.from(row.domNode.children));
      return selTds;
    }, []);
    this.tableBetter.cellSelection.setSelectedTds(selectTds);
    this.updateMenus();
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

  toggleAttribute(list: HTMLUListElement, tooltip: HTMLDivElement, e?: PointerEvent) {
    // @ts-expect-error
    if (e && e.target.closest('li.ql-table-header-row')) return;
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

  toggleHeaderRow() {
    const { selectedTds, hasTdTh } = this.tableBetter.cellSelection;
    const { hasTd, hasTh } = hasTdTh(selectedTds);
    if (!hasTd && hasTh) {
      this.convertToRow();
    } else {
      this.convertToHeaderRow();
    }
  }

  toggleHeaderRowSwitch(value?: string) {
    if (!this.tableHeaderRow) return;
    const switchInner = this.tableHeaderRow.querySelector('.ql-table-switch-inner');
    if (!value) {
      const ariaChecked = switchInner.getAttribute('aria-checked');
      value = ariaChecked === 'false' ? 'true' : 'false';
    }
    switchInner.setAttribute('aria-checked', value);
  }

  updateMenus(table: HTMLElement = this.table) {
    if (!table) return;
    requestAnimationFrame(() => {
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