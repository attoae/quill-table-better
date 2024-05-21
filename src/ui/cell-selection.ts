import Quill from 'quill';
import {
  getCorrectBounds,
  getComputeBounds,
  getComputeSelectedTds
} from '../utils';
import { TableCellBlock } from '../formats/table';

class CellSelection {
  quill: any;
  selectedTds: Element[];
  startTd: Element;
  endTd: Element;
  constructor(quill: any) {
    this.quill = quill;
    this.selectedTds = [];
    this.startTd = null;
    this.endTd = null;
    this.quill.root.addEventListener('mousedown', this.handleMousedown.bind(this));
    this.quill.root.addEventListener('click', this.handleClick.bind(this));
    document.addEventListener('keyup', this.handleKeyup.bind(this));
  }

  clearSelected() {
    for (const td of this.selectedTds) {
      td.classList && td.classList.remove('ql-cell-focused', 'ql-cell-selected');
    }
    this.selectedTds = [];
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
}

export default CellSelection;