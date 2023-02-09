import Quill from 'quill';
import { setElementProperty, getCorrectBounds } from '../utils';
import { TableCell } from '../formats/table';

interface CorrectBound {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width?: number;
  height?: number;
}

const DEVIATION = 2;

class CellSelection {
  quill: any;
  table: Element;
  selectedTds: Element[];
  constructor(quill: any, table: Element) {
    // if (table) return;
    this.quill = quill;
    this.table = table;
    this.selectedTds = [];
    this.quill.root.addEventListener('mousedown', this.handleMousedown.bind(this), false);
  }

  handleMousedown(e: MouseEvent) {
    if (!(e.target as Element).closest('table')) return;
    this.clearSelected();
    const startTd = (e.target as Element).closest('td');
    this.selectedTds = [startTd];
    startTd.classList.add('ql-cell-focused');
    
    const handleMouseMove = (e: MouseEvent) => {
      this.clearSelected();
      const endTd = (e.target as Element).closest('td');
      const startCorrectBounds = getCorrectBounds(startTd, this.quill.container);
      const endCorrectBounds = getCorrectBounds(endTd, this.quill.container);
      const computeBounds = this.getComputeBounds(startCorrectBounds, endCorrectBounds);
      this.selectedTds = this.getComputeSelectedTds(computeBounds, this.table);
      if (this.selectedTds.length === 1) {
        const td = this.selectedTds[0];
        td.classList && td.classList.add('ql-cell-focused');
      } else {
        for (const td of this.selectedTds) {
          td.classList && td.classList.add('ql-cell-selected');
        }
      }
      // e.preventDefault();
      if (startTd !== endTd) this.quill.blur();
    }

    const handleMouseup = (e: MouseEvent) => {
      // e.preventDefault();
      this.quill.root.removeEventListener('mousemove', handleMouseMove, false);
      this.quill.root.removeEventListener('mouseup', handleMouseup, false);
    }

    this.quill.root.addEventListener('mousemove', handleMouseMove, false);
    this.quill.root.addEventListener('mouseup', handleMouseup, false);
  }

  clearSelected() {
    for (const td of this.selectedTds) {
      td.classList && td.classList.remove('ql-cell-focused', 'ql-cell-selected');
    }
    this.selectedTds = [];
  }

  getComputeBounds(startCorrectBounds: CorrectBound, endCorrectBounds: CorrectBound) {
    const left = Math.min(startCorrectBounds.left, endCorrectBounds.left);
    const right = Math.max(startCorrectBounds.right, endCorrectBounds.right);
    const top = Math.min(startCorrectBounds.top, endCorrectBounds.top);
    const bottom = Math.max(startCorrectBounds.bottom, endCorrectBounds.bottom);
    return { left, right, top, bottom }
  }

  getComputeSelectedTds(computeBounds: CorrectBound, table: Element): Element[] {
    const tableParchment = Quill.find(table);
    const tableCells = tableParchment.descendants(TableCell); 
    return tableCells.reduce((selectedTds: Element[], tableCell: any) => {
      const { left, top, width, height } = getCorrectBounds(tableCell.domNode, this.quill.container);
      if (
        left + DEVIATION >= computeBounds.left &&
        left - DEVIATION + width <= computeBounds.right &&
        top + DEVIATION >= computeBounds.top &&
        top - DEVIATION + height <= computeBounds.bottom
      ) {
        selectedTds.push(tableCell.domNode);
      }
      return selectedTds;
    }, []);
  }

  updateTable(table: Element) {
    this.table = table;
  }
}

export default CellSelection;