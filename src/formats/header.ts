import Quill from 'quill';
import { TableCellBlock } from './table';

const Header = Quill.import('formats/header');

class TableHeader extends Header {
  static blotName = 'table-header';
  static className = 'ql-table-header';

  static create(value: string) {
    const node = super.create(value);
    return node;
  }

  format(name: string, value: string) {
    if (name === 'header') {
      this.replaceWith(TableCellBlock.blotName);
    } else {
      super.format(name, value);
    }
  }
}

Quill.register({
  'formats/table-header': TableHeader
}, true);

export default TableHeader;