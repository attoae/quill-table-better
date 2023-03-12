import {
  getCorrectBounds,
  getComputeBounds,
  getComputeSelectedTds
} from '../utils';

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
  }

  clearSelected() {
    for (const td of this.selectedTds) {
      td.classList && td.classList.remove('ql-cell-focused', 'ql-cell-selected');
    }
    this.selectedTds = [];
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