import Quill from 'quill';
import Delta from 'quill-delta';
import type { Op } from 'quill-delta';
import {
  getComputeBounds,
  getComputeSelectedTds,
  getCopyTd,
  getCorrectBounds,
  getCorrectCellBlot
} from '../utils';
import { applyFormat } from '../utils/clipboard-matchers';
import type { AllowedChildren } from '../utils';
import {
  TableCellBlock,
  TableCell,
  TableRow,
  TableContainer
} from '../formats/table';
import { DEVIATION } from '../config';

const Block = Quill.import('blots/block');
const { BlockEmbed } = Quill.import('blots/block');
const Container = Quill.import('blots/container');

const WHITE_LIST = [
  'bold',
  'italic',
  'underline',
  'strike',
  'size',
  'color',
  'background',
  'font',
  'list',
  'header',
  'align',
  'link',
  'image'
];

// Only supports formatting for a single cell.
const SINGLE_WHITE_LIST = ['link', 'image'];

// @ts-ignore
function isLine(blot: unknown): blot is Block | BlockEmbed {
  return blot instanceof Block || blot instanceof BlockEmbed;
}

class CellSelection {
  quill: any;
  selectedTds: Element[];
  startTd: Element;
  endTd: Element;
  disabledList: Array<HTMLElement | Element>;
  singleList: Array<HTMLElement | Element>;
  tableBetter: any;
  constructor(quill: any, tableBetter: any) {
    this.quill = quill;
    this.selectedTds = [];
    this.startTd = null;
    this.endTd = null;
    this.disabledList = [];
    this.singleList = [];
    this.tableBetter = tableBetter;
    this.quill.root.addEventListener('click', this.handleClick.bind(this));
    this.initDocumentListener();
    this.initWhiteList();
  }

  attach(input: HTMLElement) {
    let format = Array.from(input.classList).find(className => {
      return className.indexOf('ql-') === 0;
    });
    if (!format) return;
    const [whiteList, singleWhiteList] = this.getButtonsWhiteList();
    const correctDisabled = this.getCorrectDisabled(input, format);
    format = format.slice('ql-'.length);
    if (!whiteList.includes(format)) {
      this.disabledList.push(...correctDisabled);
    }
    if (singleWhiteList.includes(format)) {
      this.singleList.push(...correctDisabled);
    }
  }

  clearSelected() {
    for (const td of this.selectedTds) {
      td.classList && td.classList.remove('ql-cell-focused', 'ql-cell-selected');
    }
    this.selectedTds = [];
    this.startTd = null;
    this.endTd = null;
  }

  exitTableFocus(block: AllowedChildren, up: boolean) {
    const cell = getCorrectCellBlot(block);
    const table = cell.table();
    const offset = up ? -1 : table.length();
    const index = table.offset(this.quill.scroll) + offset;
    this.tableBetter.hideTools();
    this.quill.setSelection(index, 0, Quill.sources.USER);
  }

  getButtonsWhiteList(): [string[], string[]] {
    const { options = {} } = this.tableBetter;
    const { toolbarButtons = {} } = options;
    const {
      whiteList = WHITE_LIST,
      singleWhiteList = SINGLE_WHITE_LIST
    } = toolbarButtons;
    return [whiteList, singleWhiteList];
  }

  getCopyColumns(container: Element) {
    const tr = container.querySelector('tr');
    const children = Array.from(tr.querySelectorAll('td'));
    return children.reduce((sum: number, td: HTMLTableCellElement) => {
      const colspan = ~~td.getAttribute('colspan') || 1;
      return sum += colspan;
    }, 0);
  }

  getCopyData() {
    const tableBlot = Quill.find(this.selectedTds[0]).table();
    const tableCells = tableBlot.descendants(TableCell);
    if (tableCells.length === this.selectedTds.length) {
      const html = tableBlot.getCopyTable();
      const text = this.getText(html);
      return { html, text };
    }
    let html = '';
    const map: { [propName: string]: Element[] } = {};
    for (const td of this.selectedTds) {
      const rowId = td.getAttribute('data-row');
      if (!map[rowId]) {
        map[rowId] = [];
      }
      map[rowId].push(td);
    }
    for (const tds of Object.values(map)) {
      let res = '';
      for (const td of tds) {
        res += getCopyTd(td.outerHTML);
      }
      res = `<tr>${res}</tr>`;
      html += res;
    } 
    html = `<table><tbody>${html}</tbody></table>`;
    const text = this.getText(html);
    return { html, text };
  }

  getCorrectDisabled(input: HTMLElement, format: string) {
    if (input.tagName !== 'SELECT') return [input];
    const parentElement = input.closest('span.ql-formats');
    if (!parentElement) return [input];
    const child = parentElement.querySelectorAll(`span.${format}.ql-picker`);
    return [...child, input];
  }

  getCorrectRow(td: Element, key: string) {
    const offset = key === 'next' ? 0 : -1;
    let rowspan = (~~td.getAttribute('rowspan') || 1) + offset || 1;
    const cell: TableCell = Quill.find(td);
    let row = cell.parent;
    while (row && rowspan) {
      row = row[key];
      rowspan--;
    }
    return row?.domNode;
  }

  getCorrectValue(format: string, value: boolean | string) {
    for (const td of this.selectedTds) {
      const blot = Quill.find(td);
      const html = blot.html() || td.outerHTML;
      const delta = this.quill.clipboard.convert({
        html,
        text: '\n'
      })
      for (const op of delta.ops) {
        if (this.isContinue(op)) continue;
        value = this.getListCorrectValue(format, value, op?.attributes);
        const val = (op?.attributes && op?.attributes[format]) || false;
        if (value != val) return value;
      }
    }
    return !value;
  }

  getListCorrectValue(
    format: string,
    value: boolean | string,
    formats: any = {}
  ) {
    if (format !== 'list') return value;
    if (value === 'check') {
      if (formats[format] === 'checked' || formats[format] === 'unchecked') {
        return false;
      } else {
        return 'unchecked';
      }
    }
    return value;
  }

  getPasteComputeBounds(startTd: Element, rightTd: Element, row: TableRow) {
    const startTdBounds = startTd.getBoundingClientRect();
    const rightTdBounds = rightTd.getBoundingClientRect();
    const rowBounds = row.domNode.getBoundingClientRect();
    const containerBounds = this.quill.container.getBoundingClientRect();
    const scrollLeft = this.quill.container.scrollLeft;
    const scrollTop = this.quill.container.scrollTop;
    const left = startTdBounds.left - containerBounds.left - scrollLeft;
    const right = rightTdBounds.right - containerBounds.left - scrollLeft;
    const top = startTdBounds.top - containerBounds.top - scrollTop;
    const bottom = rowBounds.bottom - containerBounds.top - scrollTop;
    return {
      left,
      right,
      top,
      bottom
    }
  }

  getPasteInfo(td: Element, copyColumns: number, rowspan: number): any {
    let clospan = 0;
    let cloTd = null;
    let rowTd = null;
    let row: Element = td.parentElement;
    while (td) {
      const colspan = ~~td.getAttribute('colspan') || 1;
      clospan += colspan;
      if (clospan >= copyColumns) {
        clospan = copyColumns;
        cloTd = td;
        break;
      }
      td = td.nextElementSibling;
    }
    while (--rowspan) {
      if (!row.nextElementSibling) {
        rowTd = row.firstElementChild;
        break;
      }
      row = row.nextElementSibling;
    }
    return [
      { clospan: Math.abs(copyColumns - clospan), cloTd },
      { rowspan, rowTd }
    ];
  }

  getPasteLastRow(row: TableRow, len: number) {
    while (--len && row) {
      row = row.next;
    }
    return row;
  }

  getPasteTds(computeSelectedTds: Element[]) {
    const map: { [propName: string]: Element[] } = {};
    for (const td of computeSelectedTds) {
      const id = td.getAttribute('data-row');
      if (!map[id]) map[id] = [];
      map[id].push(td);
    }
    return Object.values(map);
  }

  getText(html: string): string {
    const delta: Delta = this.quill.clipboard.convert({ html });
    return delta
      .filter((op) => typeof op.insert === 'string')
      .map((op) => op.insert)
      .join('');
  }

  handleClick(e: MouseEvent) {
    if (e.detail < 3 || !this.selectedTds.length) return;
    // Multiple clicks result in cell being selected
    // Cell are deleted when deleting
    const { index, length } = this.quill.getSelection(true);
    this.quill.setSelection(index, length - 1, Quill.sources.SILENT);
    this.quill.scrollSelectionIntoView();
  }

  handleDeleteKeyup(e: KeyboardEvent) {
    if (this.selectedTds?.length < 2) return;
    if (e.key === 'Backspace' || e.key === 'Delete') {
      if (e.ctrlKey) {
        this.tableBetter.tableMenus.deleteColumn(true);
        this.tableBetter.tableMenus.deleteRow(true);
      } else {
        this.removeSelectedTdsContent();
      }
    }
  }

  handleKeyup(e: KeyboardEvent) {
    switch (e.key) {
      case 'ArrowLeft':
      case 'ArrowRight':
        this.makeTableArrowLevelHandler(e.key);
        break;
      case 'ArrowUp':
      case 'ArrowDown':
        this.makeTableArrowVerticalHandler(e.key);
        break;
      default:
        break;
    }
  }

  handleMousedown(e: MouseEvent) {
    this.clearSelected();
    const table = (e.target as Element).closest('table');
    if (!table) return;
    this.tableBetter.tableMenus.destroyTablePropertiesForm();
    const startTd = (e.target as Element).closest('td');
    this.startTd = startTd;
    this.endTd = startTd;
    this.selectedTds = [startTd];
    startTd.classList.add('ql-cell-focused');
    
    const handleMouseMove = (e: MouseEvent) => {
      const endTd = (e.target as Element).closest('td');
      if (!endTd) return;
      const isEqualNode = startTd.isEqualNode(endTd);
      if (isEqualNode) return;
      this.clearSelected();
      this.startTd = startTd;
      this.endTd = endTd;
      const startCorrectBounds = getCorrectBounds(startTd, this.quill.container);
      const endCorrectBounds = getCorrectBounds(endTd, this.quill.container);
      const computeBounds = getComputeBounds(startCorrectBounds, endCorrectBounds);
      this.selectedTds = getComputeSelectedTds(computeBounds, table, this.quill.container);
      for (const td of this.selectedTds) {
        td.classList && td.classList.add('ql-cell-selected');
      }
      if (!isEqualNode) this.quill.blur();
    }

    const handleMouseup = (e: MouseEvent) => {
      this.setSingleDisabled();
      this.setCorrectPositionTds(this.startTd, this.endTd, this.selectedTds); 
      this.quill.root.removeEventListener('mousemove', handleMouseMove);
      this.quill.root.removeEventListener('mouseup', handleMouseup);
    }

    this.quill.root.addEventListener('mousemove', handleMouseMove);
    this.quill.root.addEventListener('mouseup', handleMouseup);
  }

  initDocumentListener() {
    document.addEventListener('copy', (e: ClipboardEvent) => this.onCaptureCopy(e, false));
    document.addEventListener('cut', (e: ClipboardEvent) => this.onCaptureCopy(e, true));
    document.addEventListener('keyup', this.handleDeleteKeyup.bind(this));
    document.addEventListener('paste', this.onCapturePaste.bind(this));
  }

  initWhiteList() {
    const toolbar = this.quill.getModule('toolbar');
    Array.from(toolbar.container.querySelectorAll('button, select')).forEach(
      input => {
        // @ts-ignore
        this.attach(input);
      }
    );
  }

  insertColumnCell(table: TableContainer, offset: number) {
    const tbody = table.tbody();
    if (!tbody) return;
    tbody.children.forEach((row: TableRow) => {
      const id = row.children.tail.domNode.getAttribute('data-row');
      for (let i = 0; i < offset; i++) {
        table.insertColumnCell(row, id, null);
      }
    });
  }

  insertRow(table: TableContainer, offset: number, td: Element) {
    const index = Quill.find(td).rowOffset();
    while (offset--) {
      table.insertRow(index + 1, 1);
    }
  }

  insertWith(insert: string | Record<string, unknown>) {
    if (typeof insert !== 'string') return false;
    return insert.startsWith('\n') && insert.endsWith('\n');
  }

  isContinue(op: Op) {
    if (
      this.insertWith(op.insert) &&
      (
        !op.attributes ||
        op.attributes['table-list'] ||
        op.attributes['table-header']
      )
    ) {
      return true;
    }
    return false;
  }

  lines(blot: TableCell) {
    const getLines = (blot: TableCell) => {
      // @ts-ignore
      let lines: (Block | BlockEmbed)[] = [];
      blot.children.forEach((child: any) => {
        if (child instanceof Container) {
          lines = lines.concat(getLines(child));
        } else if (isLine(child)) {
          lines.push(child);
        }
      });
      return lines;
    };
    return getLines(blot);
  }

  makeTableArrowLevelHandler(key: string) {
    const td = key === 'ArrowLeft' ? this.startTd : this.endTd;
    const range = this.quill.getSelection();
    if (!range) return;
    const [block] = this.quill.getLine(range.index);
    const cell = getCorrectCellBlot(block);
    if (!cell) return this.tableBetter.hideTools();
    if (cell && (!td || !td.isEqualNode(cell.domNode))) {
      this.setSelected(cell.domNode, false);
      this.tableBetter.showTools(false);
    }
  }

  makeTableArrowVerticalHandler(key: string) {
    const up = key === 'ArrowUp' ? true : false;
    const range = this.quill.getSelection();
    if (!range) return;
    const [block, offset] = this.quill.getLine(range.index);
    const _key = up ? 'prev' : 'next';
    if (block[_key] && this.selectedTds.length) {
      const index =
        block[_key].offset(this.quill.scroll) +
        Math.min(offset, block[_key].length() - 1);
      this.quill.setSelection(index, 0, Quill.sources.USER);
    } else {
      if (!this.selectedTds.length) {
        const cellBlot = getCorrectCellBlot(block);
        if (!cellBlot) return;
        this.tableArrowSelection(up, cellBlot);
        this.tableBetter.showTools(false);
        return;
      }
      const td = up ? this.startTd : this.endTd;
      const cell = Quill.find(td);
      const targetRow = cell.parent[_key];
      const { left: _left, right: _right } = td.getBoundingClientRect();
      if (targetRow) {
        let cellBlot = null;
        let row = targetRow;
        while (row && !cellBlot) {
          let ref = row.children.head;
          while (ref) {
            const { left, right } = ref.domNode.getBoundingClientRect();
            if (Math.abs(left - _left) <= DEVIATION) {
              cellBlot = ref;
              break;
            } else if (Math.abs(right - _right) <= DEVIATION) {
              cellBlot = ref;
              break;
            }
            ref = ref.next;
          }
          row = row[_key];
        }
        if (!cellBlot) {
          this.exitTableFocus(block, up);
        } else {
          this.tableArrowSelection(up, cellBlot);
        }
      } else {
        this.exitTableFocus(block, up);
      }
    }
  }

  onCaptureCopy(e: ClipboardEvent, isCut = false) {
    if (this.selectedTds?.length < 2) return;
    if (e.defaultPrevented) return;
    e.preventDefault();
    const { html, text } = this.getCopyData();
    e.clipboardData?.setData('text/plain', text);
    e.clipboardData?.setData('text/html', html);
    if (isCut) this.removeSelectedTdsContent();
  }

  onCapturePaste(e: ClipboardEvent) {
    if (!this.selectedTds?.length) return;
    e.preventDefault();
    const html = e.clipboardData?.getData('text/html');
    const text = e.clipboardData?.getData('text/plain');
    const container = document.createElement('div');
    container.innerHTML = html;
    const cell = Quill.find(this.startTd);
    const row = cell.row();
    const table = cell.table();
    const copyRows = Array.from(container.querySelectorAll('tr'));
    if (!copyRows.length) return;
    this.quill.history.cutoff();
    const copyColumns = this.getCopyColumns(container);
    const [cloInfo, rowInfo] = this.getPasteInfo(this.startTd, copyColumns, copyRows.length);
    const { clospan, cloTd } = cloInfo;
    const { rowspan, rowTd } = rowInfo;
    if (clospan) this.insertColumnCell(table, clospan);
    if (rowspan) this.insertRow(table, rowspan, rowTd);
    const rightTd = clospan ? row.children.tail.domNode : cloTd;
    const pasteLastRow = this.getPasteLastRow(row, copyRows.length);
    const computeBounds = this.getPasteComputeBounds(this.startTd, rightTd, pasteLastRow);
    const pasteTds = this.getPasteTds(getComputeSelectedTds(computeBounds, table.domNode, this.quill.container));
    const copyTds = copyRows.reduce((copyTds: HTMLTableCellElement[][], row: HTMLTableRowElement) => {
      copyTds.push(Array.from(row.querySelectorAll('td')));
      return copyTds;
    }, []);
    const selectedTds: HTMLTableCellElement[] = [];
    while (copyTds.length) {
      const copyTs = copyTds.shift();
      const pasteTs = pasteTds.shift();
      let prevPasteTd = null;
      let cell: TableCell = null;
      while (copyTs.length) {
        const copyTd = copyTs.shift();
        const pasteTd = pasteTs.shift();
        if (!pasteTd) {
          const id = prevPasteTd.getAttribute('data-row');
          const ref = Quill.find(prevPasteTd);
          cell = table.insertColumnCell(ref.parent, id, ref.next);
          cell = this.pasteSelectedTd(cell.domNode, copyTd);
          prevPasteTd = cell.domNode;
        } else {
          prevPasteTd = pasteTd;
          cell = this.pasteSelectedTd(pasteTd, copyTd);
        }
        cell && selectedTds.push(cell.domNode);
      }
      while (pasteTs.length) {
        const pasteTd = pasteTs.shift();
        pasteTd.remove();
      }
    }
    this.quill.blur();
    this.setSelectedTds(selectedTds);
    this.tableBetter.tableMenus.updateMenus();
    this.quill.scrollSelectionIntoView();
  }

  pasteSelectedTd(selectedTd: Element, copyTd: Element) {
    const id = selectedTd.getAttribute('data-row');
    const copyFormats = TableCell.formats(copyTd);
    Object.assign(copyFormats, { 'data-row': id });
    const cell = Quill.find(selectedTd);
    const _cell = cell.replaceWith(cell.statics.blotName, copyFormats);
    this.quill.setSelection(
      _cell.offset(this.quill.scroll) + _cell.length() - 1,
      0,
      Quill.sources.USER
    );
    const range = this.quill.getSelection(true);
    const formats = this.quill.getFormat(range.index);
    const html = copyTd.innerHTML;
    const text = this.getText(html);
    const pastedDelta = this.quill.clipboard.convert({ text, html });
    const delta = new Delta()
      .retain(range.index)
      .delete(range.length)
      .concat(applyFormat(pastedDelta, formats));
    this.quill.updateContents(delta, Quill.sources.USER);
    return _cell;
  }

  removeCursor() {
    const range = this.quill.getSelection(true);
    if (range && range.length === 0) {
      // The attach function of the toolbar module generated extra cursor
      // when clicked, which needs to be removed.
      this.quill.selection.cursor.remove();
      this.quill.blur();
    }
  }

  removeSelectedTdContent(td: Element) {
    const tdBlot = Quill.find(td);
    let head = tdBlot.children.head;
    const cellId = head.formats()[TableCellBlock.blotName];
    const cellBlock = this.quill.scroll.create(TableCellBlock.blotName, cellId);
    tdBlot.insertBefore(cellBlock, head);
    while (head) {
      head.remove();
      head = head.next;
    }
  }

  removeSelectedTdsContent() {
    if (this.selectedTds.length < 2) return;
    for (const td of this.selectedTds) {
      this.removeSelectedTdContent(td);
    }
    this.tableBetter.tableMenus.updateMenus();
  }

  setCorrectPositionTds(startTd: Element, endTd: Element, selectedTds: Element[]) {
    if (!startTd || !endTd || selectedTds.length < 2) return;
    const firstTd = selectedTds[0];
    const lastTd = selectedTds[selectedTds.length - 1];
    const tds = [...new Set([startTd, endTd, firstTd, lastTd])];
    tds.sort((prev: Element, next: Element) => {
      const prevBounds = prev.getBoundingClientRect();
      const nextBounds = next.getBoundingClientRect();
      if (
        (
          prevBounds.top <= nextBounds.top ||
          prevBounds.bottom <= nextBounds.bottom
        ) &&
        (
          prevBounds.left <= nextBounds.left ||
          prevBounds.right <= nextBounds.right
        )
      ) {
        return -1
      }
      return 1;
    });
    this.startTd = tds[0];
    this.endTd = tds[tds.length - 1];
  }

  setDisabled(disabled: boolean) {
    for (const input of this.disabledList) {
      if (disabled) {
        input.classList.add('ql-table-button-disabled');
      } else {
        input.classList.remove('ql-table-button-disabled');
      }
    }
    this.setSingleDisabled();
  }

  setSelected(target: Element, force: boolean = true) {
    const cell = Quill.find(target);
    this.clearSelected();
    this.startTd = target;
    this.endTd = target;
    this.selectedTds = [target];
    target.classList.add('ql-cell-focused');
    force && this.quill.setSelection(
      cell.offset(this.quill.scroll) + cell.length() - 1,
      0,
      Quill.sources.USER
    );
  }

  setSelectedTds(selectedTds: Element[]) {
    this.clearSelected();
    this.startTd = selectedTds[0];
    this.endTd = selectedTds[selectedTds.length - 1];
    this.selectedTds = selectedTds;
    for (const td of this.selectedTds) {
      td.classList && td.classList.add('ql-cell-selected');
    }
  }

  setSelectedTdsFormat(format: string, value: boolean | string) {
    const selectedTds = [];
    const toolbar = this.quill.getModule('toolbar');
    for (const td of this.selectedTds) {
      if (toolbar.handlers[format] != null) {
        const cellBlot = Quill.find(td);
        const lines = this.lines(cellBlot);
        const blot = toolbar.handlers[format].call(toolbar, value, lines);
        blot && selectedTds.push(getCorrectCellBlot(blot).domNode);
      } else {
        const selection = window.getSelection();
        selection.selectAllChildren(td);
        this.quill.format(format, value, Quill.sources.USER);
        selection.removeAllRanges();
      }
    }
    this.quill.blur();
    selectedTds.length && this.setSelectedTds(selectedTds);
  }

  setSingleDisabled() {
    for (const input of this.singleList) {
      if (this.selectedTds.length > 1) {
        input.classList.add('ql-table-button-disabled');
      } else {
        input.classList.remove('ql-table-button-disabled');
      }
    }
  }

  tableArrowSelection(up: boolean, cellBlot: TableCell) {
    const key = up ? 'tail' : 'head';
    const offset = up ? cellBlot.children[key].length() - 1 : 0;
    this.setSelected(cellBlot.domNode, false);
    const index = cellBlot.children[key].offset(this.quill.scroll) + offset;
    this.quill.setSelection(index, 0, Quill.sources.USER);
  }

  updateSelected(type: string) {
    switch (type) {
      case 'column':
        {
          const target =
            this.endTd.nextElementSibling ||
            this.startTd.previousElementSibling;
          if (!target) return;
          this.setSelected(target);
        }
        break;
      case 'row':
        {
          const row =
            this.getCorrectRow(this.endTd, 'next') ||
            this.getCorrectRow(this.startTd, 'prev');
          if (!row) return;
          const startCorrectBounds = getCorrectBounds(this.startTd, this.quill.container);
          let child = row.firstElementChild;
          while (child) {
            const childCorrectBounds = getCorrectBounds(child, this.quill.container);
            if (
              childCorrectBounds.left + DEVIATION >= startCorrectBounds.left ||
              childCorrectBounds.right - DEVIATION >= startCorrectBounds.left
            ) {
              this.setSelected(child);
              return;
            }
            child = child.nextElementSibling;
          }
          this.setSelected(row.firstElementChild);
        }
        break;
      default:
        break;
    }
  }
}

export default CellSelection;