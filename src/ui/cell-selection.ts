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
  'header'
];

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
  constructor(quill: any) {
    this.quill = quill;
    this.selectedTds = [];
    this.startTd = null;
    this.endTd = null;
    this.disabledList = [];
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
  }

  clearSelected() {
    for (const td of this.selectedTds) {
      td.classList && td.classList.remove('ql-cell-focused', 'ql-cell-selected');
    }
    this.selectedTds = [];
  }

  getCorrectValue(format: string, value: boolean | string) {
    // this.removeCursor();
    for (const td of this.selectedTds) {
      const blot = Quill.find(td);
      const html = blot.html() || td.outerHTML;
      const delta = this.quill.clipboard.convert({
        html,
        text: '\n'
      })
      for (const op of delta.ops) {
        if (!op.attributes && op.insert === '\n') continue;
        const val = (op?.attributes && op?.attributes[format]) || false;
        if (value != val) return value;
      }
    }
    return !value;
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
      this.quill.root.removeEventListener('mousemove', handleMouseMove);
      this.quill.root.removeEventListener('mouseup', handleMouseup);
    }

    this.quill.root.addEventListener('mousemove', handleMouseMove);
    this.quill.root.addEventListener('mouseup', handleMouseup);
  }

  initWhiteList() {
    const toolbar = this.quill.getModule('toolbar');
    const selectors = 'button, select, .ql-align';
    Array.from(toolbar.container.querySelectorAll(selectors)).forEach(
      input => {
        // @ts-ignore
        this.attach(input);
      }
    );
  }

  makeTableArrowLevelHandler(key: string) {
    const _key = key === 'ArrowLeft' ? 'prev' : 'next';
    const td = key === 'ArrowLeft' ? this.startTd : this.endTd;
    const cell = Quill.find(td);
    if (cell[_key]) {
      this.setSelected(cell[_key].domNode);
    } else {
      const targetRow = cell.parent[_key];
      if (targetRow) {
        const _key = key === 'ArrowLeft' ? 'tail' : 'head';
        this.setSelected(targetRow.children[_key].domNode);
      } else {
        this.setSelected(td);
      }
    }
  }

  makeTableArrowVerticalHandler(key: string) {
    const _key = key === 'ArrowUp' ? 'prev' : 'next';
    const td = key === 'ArrowUp' ? this.startTd : this.endTd;
    const cell = Quill.find(td);
    const targetRow = cell.parent[_key];
    const { left, right } = td.getBoundingClientRect();
    const position = 'ArrowUp' ? left : right;
    if (!targetRow) {
      this.setSelected(td);
    } else {
      let selected = null;
      let row = targetRow;
      while (row && !selected) {
        let ref = row.children.head;
        while (ref) {
          const { left, right } = ref.domNode.getBoundingClientRect();
          if (Math.abs(left - position) <= 2) {
            selected = ref.domNode;
            break;
          } else if (Math.abs(right - position) <= 2 && !ref.next) {
            selected = ref.domNode;
            break;
          }
          ref = ref.next;
        }
        row = row[_key];
      }
      this.setSelected(selected);
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
    this.quill.selection.setNativeRange(this.endTd);
  }

  setDisabled(disabled: boolean) {
    for (const input of this.disabledList) {
      if (disabled) {
        input.classList.add('ql-table-button-disabled');
      } else {
        input.classList.remove('ql-table-button-disabled');
      }
    }
  }

  setSelected(target: Element) {
    const cell = Quill.find(target);
    this.clearSelected();
    this.startTd = target;
    this.endTd = target;
    this.selectedTds = [target];
    target.classList.add('ql-cell-focused');
    this.quill.setSelection(
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