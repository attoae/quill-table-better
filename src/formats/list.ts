import Quill from 'quill';
import { TableCellBlock } from './table';

const List = Quill.import('formats/list');
const Container = Quill.import('blots/container');

class ListContainer extends Container {}
ListContainer.blotName = 'ql-list-container';
ListContainer.className = 'ql-list-container'
ListContainer.tagName = 'OL';

class TableList extends List {
  static blotName = 'table-list';
  static className = 'ql-table-list';

  format(name: string, value: string) {
    if (name === 'list' && !value) {
      this.replaceWith(TableCellBlock.blotName);
    } else {
      super.format(name, value);
    }
  }

  static register() {
    Quill.register(ListContainer);
  }
}

Quill.register({
  'formats/table-list': TableList
}, true);

ListContainer.allowedChildren = [TableList];
TableList.requiredContainer = ListContainer;

export { ListContainer, TableList as default };
