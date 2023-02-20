import merge from 'lodash.merge';
import { setElementProperty, getCorrectBounds } from '../utils';
import columnIcon from '../assets/icon/column.svg';
import downIcon from '../assets/icon/down.svg';

interface Params {
  clientX: number;
  clientY: number;
}

interface Children {
  [propName: string]: {
    content: string
    handler: () => void
  }
}

interface MenusDefaults {
  [propName: string]: {
    content: string
    icon: string
    handler: () => void
    children?: Children
  }
}

const MENUS_DEFAULTS: MenusDefaults = {
  column: {
    content: 'Column',
    icon: columnIcon,
    handler: () => {},
    children: {
      left: {
        content: 'Insert column left',
        handler: () => {}
      },
      right: {
        content: 'Insert column right',
        handler: () => {}
      },
      delete: {
        content: 'Delete column',
        handler: () => {}
      }
    }
  },
  row: {
    content: 'Row',
    icon: columnIcon,
    handler: () => {},
    children: {
      above: {
        content: 'Insert row above',
        handler: () => {}
      },
      below: {
        content: 'Insert row below',
        handler: () => {}
      },
      delete: {
        content: 'Delete row',
        handler: () => {}
      }
    }
  },
}

class TableMenus {
  quill: any;
  table: Element | null;
  root: HTMLElement;
  prevList: HTMLUListElement | null;
  constructor(quill: any, options?: any) {
    this.quill = quill;
    this.table = null;
    this.root = this.createMenus();
    this.prevList = null;
    this.quill.root.addEventListener('click', this.handleClick.bind(this));
  }

  handleClick(e: MouseEvent) {
    const table = (e.target as Element).closest('table');
    this.prevList && this.prevList.classList.add('ql-hidden');
    this.prevList = null;
    if (!table) {
      this.root.classList.add('ql-hidden');
      return;
    } else {
      // const cell = (e.target as Element).closest('td');
      // const { left, right, top } = getCorrectBounds(cell, this.quill.container);
      // this.root.classList.remove('ql-hidden');
      // const { height } = this.root.getBoundingClientRect();
      // setElementProperty(this.root, {
      //   left: `${left}px`,
      //   top: `${top - height - 10}px`
      // });
      this.root.classList.remove('ql-hidden');
      if (!table.isEqualNode(this.table)) {
        const { left, right, top } = getCorrectBounds(table, this.quill.container);
        const { height, width } = this.root.getBoundingClientRect();
        setElementProperty(this.root, {
          left: `${(left + right - width) >> 1}px`,
          top: `${top - height - 10}px`
        });
      }
      this.table = table;
    }
  }

  createMenus() {
    const container = document.createElement('div');
    container.classList.add('ql-table-menus-container', 'ql-hidden');
    for (const [, val] of Object.entries(MENUS_DEFAULTS)) {
      const { content, icon, children } = val;
      const list = this.createList(children);
      const tooltip = this.createTooltip(content);
      const menu = this.createMenu(icon, downIcon, !!children);
      menu.appendChild(tooltip);
      menu.appendChild(list);
      container.appendChild(menu);
      menu.addEventListener('click', this.toggleAttribute.bind(this, list));
    }
    this.quill.container.appendChild(container);
    return container;
  }

  createMenu(left: string, right: string, isDropDown: boolean) {
    const container = document.createElement('div');
    const dropDown = document.createElement('span');
    if (isDropDown) {
      dropDown.innerHTML = left + right;
    } else {
      dropDown.innerHTML = left;
    }
    container.classList.add('ql-table-dropdown');
    dropDown.classList.add('ql-table-dropdown-icon');
    container.appendChild(dropDown);
    return container;
  }

  createList(children: Children) {
    const container = document.createElement('ul');
    for (const [, child] of Object.entries(children)) {
      const { content, handler } = child;
      const list = document.createElement('li');
      list.innerText = content;
      list.addEventListener('click', handler);
      container.appendChild(list);
    }
    container.classList.add('ql-table-dropdown-list', 'ql-hidden');
    return container;
  }

  createTooltip(content: string) {
    const element = document.createElement('div');
    element.innerText = content;
    element.classList.add('ql-table-tooltip', 'ql-hidden');
    return element;
  }

  toggleAttribute(list: HTMLUListElement) {
    if (this.prevList && !this.prevList.isEqualNode(list)) {
      this.prevList.classList.add('ql-hidden');
    }
    list.classList.toggle('ql-hidden');
    this.prevList = list;
  }

  updateMenus(params: Params) {
    
  }
}

export default TableMenus;