import Quill from 'quill';
import { TableCell, TableCellBlock } from './table';
import { getCellFormats } from '../utils';

const List = Quill.import('formats/list');
const Container = Quill.import('blots/container');

class ListContainer extends Container {
  formats() {
    return { [this.statics.blotName]: {} };
  }
}
ListContainer.blotName = 'table-list-container';
ListContainer.className = 'table-list-container';
ListContainer.tagName = 'OL';

class TableList extends List {
  format(name: string, value: string) {
    const list = this.formats()[this.statics.blotName];
    if (name === 'list') {
      if (!value || value === list) {
        const [formats, cellId] = getCellFormats(this.parent.parent);
        this.wrap(TableCell.blotName, formats);
        this.replaceWith(TableCellBlock.blotName, cellId);
      } else if (value !== list) {
        super.format(this.statics.blotName, value);
      }
    } else {
      super.format(name, value);
    }
  }

  static register() {
    Quill.register(ListContainer);
  }
}
TableList.blotName = 'table-list';
TableList.className = 'table-list';

// Quill.register({
//   'formats/table-list': TableList
// }, true);

ListContainer.allowedChildren = [TableList];
TableList.requiredContainer = ListContainer;

export { ListContainer, TableList as default };
