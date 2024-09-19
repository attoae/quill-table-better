import Quill from 'quill';
import {
  getComputeBounds,
  getComputeSelectedTds,
  getCorrectBounds,
  getCorrectCellBlot
} from '../utils';
import { TableCellBlock, TableCell } from '../formats/table';
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
  disabledList: HTMLElement[];
  singleList: HTMLElement[];
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
    this.initWhiteList();
  }

  attach(input: HTMLElement) {
    let format = Array.from(input.classList).find(className => {
      return className.indexOf('ql-') === 0;
    });
    if (!format) return;
    format = format.slice('ql-'.length);
    if (!WHITE_LIST.includes(format)) {
      this.disabledList.push(input);
    }
    if (SINGLE_WHITE_LIST.includes(format)) {
      this.singleList.push(input);
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

  handleClick(e: MouseEvent) {
    if (e.detail < 3 || !this.selectedTds.length) return;
    // Multiple clicks result in cell being selected
    // Cell are deleted when deleting
    const { index, length } = this.quill.getSelection(true);
    this.quill.setSelection(index, length - 1, Quill.sources.SILENT);
    this.quill.scrollSelectionIntoView();
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
      case 'Backspace':
      case 'Delete':
        this.removeSelectedTdsContent();
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
      this.quill.root.removeEventListener('mousemove', handleMouseMove);
      this.quill.root.removeEventListener('mouseup', handleMouseup);
    }

    this.quill.root.addEventListener('mousemove', handleMouseMove);
    this.quill.root.addEventListener('mouseup', handleMouseup);
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

  insertWith(insert: string) {
    if (typeof insert !== 'string') return false;
    return insert.startsWith('\n') && insert.endsWith('\n');
  }

  isContinue(op: any) {
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
        this.tableArrowSelection(up, cellBlot);
      } else {
        const cell = getCorrectCellBlot(block);
        const table = cell.table();
        const offset = up ? -1 : table.length();
        const index = table.offset(this.quill.scroll) + offset;
        this.tableBetter.hideTools();
        this.quill.setSelection(index, 0, Quill.sources.USER);
      }
    }
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

  removeSelectedTdsContent() {
    if (this.selectedTds.length < 2) return;
    for (const td of this.selectedTds) {
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
    this.tableBetter.tableMenus.updateMenus();
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
            this.endTd.parentElement.nextElementSibling ||
            this.startTd.parentElement.previousElementSibling;
          if (!row) return;
          const startCorrectBounds = getCorrectBounds(this.startTd, this.quill.container);
          let child = row.firstElementChild;
          while (child) {
            const childCorrectBounds = getCorrectBounds(child, this.quill.container);
            if (
              childCorrectBounds.left + DEVIATION >= startCorrectBounds.left &&
              (
                childCorrectBounds.right <= startCorrectBounds.right + DEVIATION ||
                childCorrectBounds.right + DEVIATION >= startCorrectBounds.right
              )
            ) {
              this.setSelected(child);
              break;
            }
            child = child.nextElementSibling;
          }
        }
        break;
      default:
        break;
    }
  }
}

export default CellSelection;