import { setElementProperty } from '../utils';

interface Options {
  tableNode: Element
  cellNode: Element
}

class CellSelection {
  quill: any;
  options: Options;
  selected: Element[];
  constructor(quill: any, options: Options) {
    this.quill = quill;
    this.options = options;
    this.selected = [];
    this.quill.root.addEventListener('mousedown', this.handleMousedown.bind(this), false);
  }

  handleMousedown(e: MouseEvent) {
    this.clearSelected();
    if (!(e.target as Element).closest('table')) return;
    const startTd = (e.target as Element).closest('td');
    this.selected = [startTd];
    startTd.classList.add('ql-cell-focused');
    
    const handleMouseMove = (e: MouseEvent) => {
      const endTd = (e.target as Element).closest('td');
      
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
    for (const td of this.selected) {
      td.classList.remove('ql-cell-focused', 'ql-cell-selected');
    }
    this.selected = [];
  }
}

export default CellSelection;