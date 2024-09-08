import Quill from 'quill';
import { TableCellBlock, TableCell } from './table';
import { ListContainer } from './list';
import { getCellFormats, getCorrectCellBlot } from '../utils';

const Header = Quill.import('formats/header');

class TableHeader extends Header {
  static blotName = 'table-header';
  static className = 'ql-table-header';

  static create(formats: Props) {
    const { cellId, value } = formats;
    const node = super.create(value);
    node.setAttribute('data-cell', cellId);
    return node;
  }

  format(name: string, value: string, isReplace?:boolean) {
    if (name === 'header') {
      const _value = this.statics.formats(this.domNode).value;
      const cellId = this.domNode.getAttribute('data-cell');
      if (_value == value || !value) {
        this.replaceWith(TableCellBlock.blotName, cellId);
      } else {
        super.format('table-header', { cellId, value });
      }
    } else if (name === 'list') {
      const [formats, cellId] = this.getCellFormats(this.parent);
      if (isReplace) {
        this.wrap(ListContainer.blotName, { ...formats, cellId });
      } else {
        this.wrap(TableCell.blotName, formats);
      }
      return this.replaceWith('table-list', value);
    } else if (name === TableCell.blotName) {
      return this.wrap(name, value);
    } else {
      super.format(name, value);
    }
  }

  static formats(domNode: HTMLElement) {
    const cellId = domNode.getAttribute('data-cell');
    const value = this.tagName.indexOf(domNode.tagName) + 1;
    return { cellId, value };
  }

  formats() {
    const formats = this.attributes.values();
    const format = this.statics.formats(this.domNode, this.scroll);
    if (format != null) {
      formats[this.statics.blotName] = format;
    }
    return formats;
  }

  getCellFormats(parent: TableCell) {
    const cellBlot = getCorrectCellBlot(parent);
    return getCellFormats(cellBlot);
  }
}

Quill.register({
  'formats/table-header': TableHeader
}, true);

export default TableHeader;