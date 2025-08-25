import Quill from 'quill';
import type { InlineBlot } from 'parchment';
import type { InsertTableHandler } from '../types';
import tableIcon from '../assets/icon/table.svg';

const Inline = Quill.import('blots/inline') as typeof InlineBlot;
const icons = Quill.import('ui/icons');
// @ts-expect-error
icons['table-better'] = tableIcon;
const SUM = 10;
 
class ToolbarTable extends Inline {};

class TableSelect {
  computeChildren: Element[];
  root: HTMLDivElement;
  constructor() {
    this.computeChildren = [];
    this.root = this.createContainer();
  }

  clearSelected(children: NodeListOf<Element> | Element[]) {
    for (const child of children) {
      child.classList && child.classList.remove('ql-cell-selected');
    }
    this.computeChildren = [];
    this.root && this.setLabelContent(this.root.lastElementChild, null);
  }

  createContainer() {
    const container = document.createElement('div');
    const list = document.createElement('div');
    const label = document.createElement('div');
    const fragment = document.createDocumentFragment();
    for (let row = 1; row <= SUM; row++) {
      for (let column = 1; column <= SUM; column++) {
        const child = document.createElement('span');
        child.setAttribute('row', `${row}`);
        child.setAttribute('column', `${column}`);
        fragment.appendChild(child);
      }
    }
    label.innerHTML = '0 x 0';
    container.classList.add('ql-table-select-container', 'ql-hidden');
    list.classList.add('ql-table-select-list');
    label.classList.add('ql-table-select-label');
    list.appendChild(fragment);
    container.appendChild(list);
    container.appendChild(label);
    container.addEventListener('mousemove', e => this.handleMouseMove(e, container));
    return container;
  }

  getClickInfo(e: MouseEvent): [boolean, Element] {
    const target = e.target as Element;
    const container = target.closest('div.ql-table-select-container');
    const span = target.closest('span[row]');
    if (container && !span) return [true, span];
    return [false, span];
  }

  getComputeChildren(children: HTMLCollection, e: MouseEvent): Element[] {
    const computeChildren = [];
    const { clientX, clientY } = e;
    for (const child of children) {
      const { left, top } = child.getBoundingClientRect();
      if (clientX >= left && clientY >= top) {
        computeChildren.push(child);
      }
    }
    return computeChildren;
  }

  getSelectAttrs(element: Element) {
    const row = ~~element.getAttribute('row');
    const column = ~~element.getAttribute('column');
    return [row, column];
  }

  handleClick(e: MouseEvent, insertTable: InsertTableHandler) {
    const [isBetweenSpans, span] = this.getClickInfo(e);
    this.toggle(this.root, isBetweenSpans);
    if (!span) {
      // Click between two spans
      const child = this.computeChildren[this.computeChildren.length - 1];
      if (child) this.insertTable(child, insertTable);
      return;
    }
    this.insertTable(span, insertTable);
  }

  handleMouseMove(e: MouseEvent, container: Element) {
    const children = container.firstElementChild.children;
    this.clearSelected(this.computeChildren);
    const computeChildren = this.getComputeChildren(children, e);
    for (const child of computeChildren) {
      child.classList && child.classList.add('ql-cell-selected');
    }
    this.computeChildren = computeChildren;
    this.setLabelContent(container.lastElementChild, computeChildren[computeChildren.length - 1]);
  }

  hide(element: Element) {
    this.clearSelected(this.computeChildren);
    element && element.classList.add('ql-hidden');
  }

  insertTable(child: Element, insertTable: InsertTableHandler) {
    const [row, column] = this.getSelectAttrs(child);
    insertTable(row, column);
    this.hide(this.root);
  }

  setLabelContent(label: Element, child: Element) {
    if (!child) {
      label.innerHTML = '0 x 0';
    } else {
      const [row, column] = this.getSelectAttrs(child);
      label.innerHTML = `${row} x ${column}`;
    }
  }

  show(element: Element) {
    this.clearSelected(this.computeChildren);
    element && element.classList.remove('ql-hidden');
  }

  toggle(element: Element, isBetweenSpans: boolean) {
    if (!isBetweenSpans) this.clearSelected(this.computeChildren);
    element && element.classList.toggle('ql-hidden');
  }
}

export { TableSelect, ToolbarTable as default };