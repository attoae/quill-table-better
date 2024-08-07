import Quill from 'quill';
import { TableCell, TableCellBlock } from './table';
import { getCellFormats, getCorrectCellBlot } from '../utils';

const List = Quill.import('formats/list');
const Container = Quill.import('blots/container');

class ListContainer extends Container {
  static create(value: string) {
    const node = super.create();
    node.setAttribute('data-cell', value);
    return node;
  }
  
  format(name: string, value: string) {
    return this.wrap(name, value);
  }

  static formats(domNode: HTMLElement) {
    return domNode.getAttribute('data-cell');
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
  format(name: string, value: string, isReplace?:boolean) {
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
      this.wrap(name, value);
    } else if (name === 'header') {
      const [formats, cellId] = this.getCellFormats(this.parent);
      this.setReplace(isReplace, formats);
      return this.replaceWith('table-header', { cellId, value });
    } else {
      super.format(name, value);
    }
  }

  getCellFormats(parent: TableCell) {
    const cellBlot = getCorrectCellBlot(parent);
    return getCellFormats(cellBlot);
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
