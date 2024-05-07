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
    // document.addEventListener('keyup', this.handleKeyup.bind(this));
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
    this.quill.scrollIntoView();
  }

  handleKeyup(e: KeyboardEvent) {
    if (this.selectedTds.length < 2) return;
    if (e.key === 'Backspace' || e.key === 'Delete') {
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
}

export default CellSelection;