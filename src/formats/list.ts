import Quill from 'quill';
import { TableCell, TableCellBlock } from './table';
import { getCellFormats, getCorrectCellBlot } from '../utils';
import { CELL_ATTRIBUTE } from '../config';

const List = Quill.import('formats/list');
const Container = Quill.import('blots/container');

class ListContainer extends Container {
  static create(value: Props) {
    const node = super.create();
    const keys = Object.keys(value);
    for (const key of keys) {
      if (key === 'data-row') {
        node.setAttribute(key, value[key]);
      } else if (key === 'cellId') {
        node.setAttribute('data-cell', value[key]);
      } else {
        node.setAttribute(`data-${key}`, value[key]);
      }
    }
    return node;
  }
  
  format(name: string, value: string | Props) {
    return this.wrap(name, value);
  }

  static formats(domNode: HTMLElement) {
    const formats = CELL_ATTRIBUTE.reduce((formats: Props, attr) => {
      const name = attr.includes('data') ? attr : `data-${attr}`;
      if (domNode.hasAttribute(name)) {
        formats[attr] = domNode.getAttribute(name);
      }
      return formats;
    }, {});
    formats['cellId'] = domNode.getAttribute('data-cell');
    return formats;
  }

  formats() {
    const formats = this.statics.formats(this.domNode, this.scroll);
    return { [this.statics.blotName]: formats };
  }
}
ListContainer.blotName = 'table-list-container';
ListContainer.className = 'table-list-container';
ListContainer.tagName = 'OL';

class TableList extends List {
  format(name: string, value: string | Props, isReplace?: boolean) {
    const list = this.formats()[this.statics.blotName];
    if (name === 'list') {
      const [formats, cellId] = this.getCellFormats(this.parent);
      if (!value || value === list) {
        this.setReplace(isReplace, formats);
        return this.replaceWith(TableCellBlock.blotName, cellId);
      } else if (value !== list) {
        return this.replaceWith(this.statics.blotName, value);
      }
    } else if (name === ListContainer.blotName) {
      if (typeof value === 'string') {
        value = { cellId: value };
      }
      const [formats, cellId] = this.getCorrectCellFormats(value);
      this.wrap(TableCell.blotName, formats);
      this.wrap(name, { ...formats, cellId });
    } else if (name === 'header') {
      const [formats, cellId] = this.getCellFormats(this.parent);
      this.setReplace(isReplace, formats);
      return this.replaceWith('table-header', { cellId, value });
    } else if (name === TableCell.blotName) {
      const listContainer = this.getListContainer(this.parent);
      if (!listContainer) return;
      const formats = listContainer.formats()[listContainer.statics.blotName];
      this.wrap(name, value);
      // @ts-ignore
      this.wrap(ListContainer.blotName, { ...formats, ...value });
    } else {
      super.format(name, value);
    }
  }

  getCellFormats(parent: TableCell) {
    const cellBlot = getCorrectCellBlot(parent);
    return getCellFormats(cellBlot);
  }

  getCorrectCellFormats(value: Props): [Props, string] {
    const cellBlot = getCorrectCellBlot(this.parent);
    if (!cellBlot) {
      const cellId = value['cellId'];
      const formats = { ...value };
      delete formats['cellId'];
      return [formats, cellId];
    } else {
      const [formats, cellId] = getCellFormats(cellBlot);
      const _formats = { ...formats, ...value };
      const _cellId = _formats['cellId'] || cellId;
      delete _formats['cellId'];
      return [_formats, _cellId];
    }
  }

  private getListContainer(blot: ListContainer) {
    while (blot) {
      if (blot.statics.blotName === ListContainer.blotName) {
        return blot;
      }
      blot = blot.parent;
    }
    return null;
  }

  static register() {
    Quill.register(ListContainer);
  }

  setReplace(isReplace: boolean, formats: Props) {
    if (isReplace) {
      this.parent.replaceWith(TableCell.blotName, formats);
    } else {
      this.wrap(TableCell.blotName, formats);
    }
  }
}
TableList.blotName = 'table-list';
TableList.className = 'table-list';

Quill.register({
  'formats/table-list': TableList
}, true);

ListContainer.allowedChildren = [TableList];
TableList.requiredContainer = ListContainer;

export { ListContainer, TableList as default };
