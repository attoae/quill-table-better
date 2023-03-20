import Quill from 'quill';
import { TableCellBlock } from './table';

const List = Quill.import('formats/list');
const Container = Quill.import('blots/container');

class ListContainer extends Container {
  formats() {
    return { [this.statics.blotName]: {} };
  }
}
ListContainer.blotName = 'table-list-container';
ListContainer.tagName = 'OL';

class TableList extends List {
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
TableList.blotName = 'table-list';

Quill.register({
  'formats/table-list': TableList
}, true);

ListContainer.allowedChildren = [TableList];
TableList.requiredContainer = ListContainer;

export { ListContainer, TableList as default };
