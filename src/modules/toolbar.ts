import Quill from 'quill';
import Delta from 'quill-delta';
import { EmbedBlot } from 'parchment';
import { getCorrectCellBlot } from '../utils';
import { TableCell } from '../formats/table';

const Container = Quill.import('blots/container');
const Toolbar = Quill.import('modules/toolbar');

class TableToolbar extends Toolbar {
  attach(input: HTMLElement) {
    let format = Array.from(input.classList).find((className) => {
      return className.indexOf('ql-') === 0;
    });
    if (!format) return;
    format = format.slice('ql-'.length);
    if (input.tagName === 'BUTTON') {
      input.setAttribute('type', 'button');
    }
    if (
      this.handlers[format] == null &&
      this.quill.scroll.query(format) == null
    ) {
      console.warn('ignoring attaching to nonexistent format', format, input);
      return;
    }
    const eventName = input.tagName === 'SELECT' ? 'change' : 'click';
    input.addEventListener(eventName, (e) => {
      const cellSelection = this.getCellSelection();
      if (cellSelection.selectedTds.length > 1) {
        this.cellSelectionAttach(input, format, e, cellSelection);
      } else {
        this.toolbarAttach(input, format, e);
      }
    });
    this.controls.push([format, input]);
  }

  private cellSelectionAttach(
    input: HTMLElement,
    format: string,
    e: Event | MouseEvent,
    cellSelection: any
  ) {
    if (input.tagName === 'SELECT') {
      // @ts-ignore
      if (input.selectedIndex < 0) return;
      // @ts-ignore
      const selected = input.options[input.selectedIndex];
      const val =
        typeof selected?.value === 'string'
          ? selected?.value
          : true;
      const value = cellSelection.getCorrectValue(format, val);
      cellSelection.setSelectedTdsFormat(format, value);
    } else {
      // @ts-ignore
      const val = input?.value || true;
      const value = cellSelection.getCorrectValue(format, val);
      cellSelection.setSelectedTdsFormat(format, value);
      e.preventDefault();
    }
  }

  getCellSelection() {
    const { cellSelection } = this.quill.getModule('table-better');
    return cellSelection;
  }

  setTableFormat(
    range: Range,
    selectedTds: Element[],
    value: string,
    name: string,
    lines: any[]
  ) {
    let blot = null;
    const _isReplace = isReplace(range, selectedTds, lines);
    for (const line of lines) {
      blot = line.format(name, value, _isReplace);
    }
    if (selectedTds.length < 2) {
      if (_isReplace && name === 'list') {
        const cellSelection = this.getCellSelection();
        const cell = getCorrectCellBlot(blot);
        cell && cellSelection.setSelected(cell.domNode);
      }
      this.quill.setSelection(range, Quill.sources.SILENT);
    }
    return blot;
  }

  private toolbarAttach(input: HTMLElement, format: string, e: Event | MouseEvent) {
    let value;
    if (input.tagName === 'SELECT') {
      // @ts-expect-error
      if (input.selectedIndex < 0) return;
      // @ts-expect-error
      const selected = input.options[input.selectedIndex];
      if (selected.hasAttribute('selected')) {
        value = false;
      } else {
        value = selected.value || false;
      }
    } else {
      if (input.classList.contains('ql-active')) {
        value = false;
      } else {
        // @ts-expect-error
        value = input.value || !input.hasAttribute('value');
      }
      e.preventDefault();
    }
    this.quill.focus();
    const [range] = this.quill.selection.getRange();
    if (this.handlers[format] != null) {
      this.handlers[format].call(this, value);
    } else if (
      this.quill.scroll.query(format).prototype instanceof EmbedBlot
    ) {
      value = prompt(`Enter ${format}`); // eslint-disable-line no-alert
      if (!value) return;
      this.quill.updateContents(
        new Delta()
          .retain(range.index)
          .delete(range.length)
          .insert({ [format]: value }),
        Quill.sources.USER,
      );
    } else {
      this.quill.format(format, value, Quill.sources.USER);
    }
    this.update(range);
  }
}

function containers(
  blot: TableCell,
  index = 0,
  length = Number.MAX_VALUE
) {
  const getContainers = (
    blot: TableCell,
    blotIndex: number,
    blotLength: number
  ) => {
    // @ts-ignore
    let containers: Container[] = [];
    let lengthLeft = blotLength;
    blot.children.forEachAt(
      blotIndex,
      blotLength,
      // @ts-ignore
      (child, childIndex, childLength) => {
        if (child instanceof Container) {
          containers.push(child);
          containers = containers.concat(getContainers(child, childIndex, lengthLeft));
        } 
        lengthLeft -= childLength;
      }
    );
    return containers;
  };
  return getContainers(blot, index, length);
}

function getLength(blots: any[]): number {
  return blots.reduce((sum, blot) => {
    return sum += blot.length();
  }, 0);
}

function isReplace(range: Range, selectedTds: Element[], lines: any[]) {
  if (selectedTds.length === 1) {
    const cellBlot = Quill.find(selectedTds[0]);
    const _containers = containers(cellBlot, range.index, range.length);
    const length = getLength(_containers);
    const _length = getLength(lines);
    return length === _length;
  }
  return !!(selectedTds.length > 1);
}

function tablehandler(
  value: string,
  selectedTds: Element[],
  name: string,
  lines?: any[]
) {
  const range = this.quill.getSelection();
  if (!lines) {
    if (!range.length && selectedTds.length === 1) {
      const [line] = this.quill.getLine(range.index);
      lines = [line];
    } else {
      lines = this.quill.getLines(range);
    }
  }
  return this.setTableFormat(range, selectedTds, value, name, lines);
}

TableToolbar.DEFAULTS = {
  container: null,
  handlers: {
    ...Toolbar.DEFAULTS.handlers,
    header(value: string, lines?: any[]) {
      const cellSelection = this.getCellSelection(); 
      const selectedTds = cellSelection.selectedTds;
      if (selectedTds.length) {
        return tablehandler.call(this, value, selectedTds, 'header', lines);
      }
      this.quill.format('header', value, Quill.sources.USER);
    },
    list(value: string, lines?: any[]) {
      const cellSelection = this.getCellSelection();
      const selectedTds = cellSelection.selectedTds;
      if (selectedTds.length) {
        return tablehandler.call(this, value, selectedTds, 'list', lines);
      }
      
      const range = this.quill.getSelection(true);
      const formats = this.quill.getFormat(range);
      if (value === 'check') {
        if (formats.list === 'checked' || formats.list === 'unchecked') {
          this.quill.format('list', false, Quill.sources.USER);
        } else {
          this.quill.format('list', 'unchecked', Quill.sources.USER);
        }
      } else {
        this.quill.format('list', value, Quill.sources.USER);
      }
    }
  }
};

export default TableToolbar;