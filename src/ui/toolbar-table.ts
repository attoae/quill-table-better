import Quill from 'quill';
import type { InlineBlot } from 'parchment';
import type { InsertTableHandler, QuillTableBetter, UseLanguageHandler } from '../types';
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
  constructor(private tableBetter?: QuillTableBetter) {
    this.computeChildren = [];
    this.root = this.createContainer();
  }

  clearSelected(children: NodeListOf<Element> | Element[]) {
    for (const child of children) {
      child.classList && child.classList.remove('ql-cell-selected');
    }
    this.computeChildren = [];
    this.root && this.setLabelContent(this.root.querySelector('.ql-table-select-label'), null);
  }

  createCheckbox(label: string, id: string) {
    const container = document.createElement('div');
    const labelELement = document.createElement('label');
    const checkbox = document.createElement('input');
    checkbox.setAttribute('type', 'checkbox');
    labelELement.innerHTML = label;
    labelELement.appendChild(checkbox);
    container.appendChild(labelELement);
    container.classList.add(id);
    return container;
  }

  createContainer() {
    const useLanguage = this.getUseLanguage();
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

    const firstRowIsHeader = this.createCheckbox(useLanguage('firstRowIsHeader'), 'ql-table-select-header');
    const fullWidth = this.createCheckbox(useLanguage('fullWidth'), 'ql-table-select-full-width')

    label.innerHTML = '0 x 0';
    container.classList.add('ql-table-select-container', 'ql-hidden');
    list.classList.add('ql-table-select-list');
    label.classList.add('ql-table-select-label');
    list.appendChild(fragment);
    container.appendChild(list);
    container.appendChild(label);
    container.appendChild(firstRowIsHeader);
    container.appendChild(fullWidth);

    list.addEventListener('mousemove', e => this.handleMouseMove(e, container));
    return container;
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

  getSelectAttrs(element: Element): [number, number] {
    const row = ~~element.getAttribute('row');
    const column = ~~element.getAttribute('column');
    return [row, column];
  }

  handleClick(e: MouseEvent, insertTable: InsertTableHandler) {
    const target = e.target as Element;
    if (target.closest('.ql-table-select-container') && !target.closest('.ql-table-select-list')) {
      // then the click is outside the table size select array
      return;
    }
    this.toggle(this.root);
    const span = target.closest('span[row]');
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
    this.setLabelContent(container.querySelector('.ql-table-select-label'), computeChildren[computeChildren.length - 1]);
  }

  hide(element: Element) {
    this.clearSelected(this.computeChildren);
    element && element.classList.add('ql-hidden');
  }

  insertTable(child: Element, insertTable: InsertTableHandler) {
    const [row, column] = this.getSelectAttrs(child);
    const firstRowIsHeader = (this.root.querySelector('.ql-table-select-header input') as HTMLInputElement).checked;
    const fullWidth = (this.root.querySelector('.ql-table-select-full-width input') as HTMLInputElement).checked;
    insertTable(row, column, firstRowIsHeader, fullWidth);
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

  toggle(element: Element) {
    this.clearSelected(this.computeChildren);
    element && element.classList.toggle('ql-hidden');
  }

  getUseLanguage() {
    const { language } = this.tableBetter;
    const useLanguage = language.useLanguage.bind(language);
    return useLanguage;
  }
}

export { TableSelect, ToolbarTable as default };