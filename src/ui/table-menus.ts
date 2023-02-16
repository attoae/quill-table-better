import merge from 'lodash.merge';
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
  root: Element | null;
  prevList: HTMLUListElement | null;
  constructor(quill: any, params: Params, options?: any) {
    this.quill = quill;
    this.root = null;
    this.prevList = null;
    this.createMenus();
  }

  createMenus() {
    const container = document.createElement('div');
    container.classList.add('ql-table-menus-container');
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