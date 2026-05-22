import Quill from 'quill';
import Delta from 'quill-delta';
import merge from 'lodash.merge';
import { EmbedBlot } from 'parchment';
import type { ContainerBlot } from 'parchment';
import type { Range } from 'quill';
import type {
  CellSelection,
  QuillTableBetter,
  TableCell,
  TableCellAllowedChildren,
  TableCellChildren
} from '../types';
import { getCorrectCellBlot } from '../utils';
import TableHeader from '../formats/header';

const Module = Quill.import('core/module');
const Container = Quill.import('blots/container') as typeof ContainerBlot;
const Toolbar = Quill.import('modules/toolbar') as typeof Module;

type Handler = (this: TableToolbar, value: any) => void;

class TableToolbar extends Toolbar {
  handlers: Record<string, Handler>;
  controls: [string, HTMLElement][];
  update: (range: Range | null) => void;
  container?: HTMLElement | null;

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
      const tableBetter = this.getTableBetter();
      if (tableBetter && tableBetter.cellSelection.selectedTds?.length > 1) {
        this.cellSelectionAttach(input, format, e, tableBetter.cellSelection);
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
      cellSelection: CellSelection
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

  getTableBetter(): QuillTableBetter | null {
    return this.quill.getModule('table-better') as QuillTableBetter | null;
  }

  setTableFormat(
      range: Range,
      selectedTds: Element[],
      value: string,
      name: string,
      lines: TableCellChildren[]
  ) {
    let blot = null;
    const tableBetter = this.getTableBetter();
    if (!tableBetter) {
      return;
    }
    const { cellSelection, tableMenus } = tableBetter;
    const _isReplace = isReplace(range, selectedTds, lines);
    for (const line of lines) {
      const isReplace = getHeaderReplace(selectedTds, name, line, _isReplace);
      blot = line.format(name, value, isReplace) as TableCellChildren;
    }
    if (selectedTds.length < 2) {
      if (_isReplace || lines.length === 1) {
        const cell = getCorrectCellBlot(blot);
        Promise.resolve().then(() => {
          if (cell && this.quill.root.contains(cell.domNode)) {
            cellSelection.setSelected(cell.domNode, false);
          } else {
            cellSelection.setSelected(selectedTds[0], false);
          }
        });
      } else {
        cellSelection.setSelected(selectedTds[0], false);
      }
      this.quill.setSelection(range, Quill.sources.SILENT);
    }
    tableMenus.updateMenus();
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
        // @ts-expect-error
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
      blot: TableCell | TableCellAllowedChildren,
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

function getHeaderReplace(
    selectedTds: Element[],
    name: string,
    line: TableCellChildren,
    _isReplace: boolean
) {
  if (
      selectedTds.length === 1 &&
      name === 'list' &&
      line.statics.blotName === TableHeader.blotName
  ) {
    return true;
  }
  return _isReplace;
}

function getLength(blots: TableCellChildren[]): number {
  return blots.reduce((sum, blot) => {
    return sum += blot.length();
  }, 0);
}

function isReplace(range: Range, selectedTds: Element[], lines: TableCellChildren[]) {
  if (selectedTds.length === 1) {
    const cellBlot = Quill.find(selectedTds[0]) as TableCell;
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
    lines?: TableCellChildren[]
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

TableToolbar.DEFAULTS = merge({}, Toolbar.DEFAULTS, {
  handlers: {
    header(value: string, lines?: TableCellChildren[]) {
      const tableBetter = this.getTableBetter();
      const selectedTds = tableBetter?.cellSelection?.selectedTds;
      if (selectedTds?.length) {
        return tablehandler.call(this, value, selectedTds, 'header', lines);
      }
      this.quill.format('header', value, Quill.sources.USER);
    },
    list(value: string, lines?: TableCellChildren[]) {
      const tableBetter = this.getTableBetter();
      const selectedTds = tableBetter?.cellSelection?.selectedTds;
      if (selectedTds?.length && tableBetter?.cellSelection) {
        if (selectedTds.length === 1) {
          const range = this.quill.getSelection(true);
          const formats = this.quill.getFormat(range);
          value = tableBetter.cellSelection.getListCorrectValue('list', value, formats);
        }
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
    },
    'table-better'() { }
  }
});

export default TableToolbar;