import Quill from 'quill';
import Delta from 'quill-delta';
import logger from 'quill/core/logger.js';
import { TableCellBlock, TableTemporary } from '../formats/table';

const Clipboard = Quill.import('modules/clipboard');
const debug = logger('quill:clipboard');

class TableClipboard extends Clipboard {
  onPaste(range: Range, { text, html }: { text?: string; html?: string }) {
    const formats = this.quill.getFormat(range.index);
    const pastedDelta = this.getTableDelta({ text, html }, formats);
    debug.log('onPaste', pastedDelta, { text, html });
    const delta = new Delta()
      .retain(range.index)
      .delete(range.length)
      .concat(pastedDelta);
    this.quill.updateContents(delta, Quill.sources.USER);
    // range.length contributes to delta.length()
    this.quill.setSelection(
      delta.length() - range.length,
      Quill.sources.SILENT,
    );
    this.quill.scrollSelectionIntoView();
  }

  private getTableDelta({ html, text }: { html?: string; text?: string }, formats: Props) {
    const delta = this.convert({ text, html }, formats);
    if (formats[TableCellBlock.blotName]) {
      for (const op of delta.ops) {
        // External copied tables or table contents copied within an editor.
        // Subsequent version processing.
        if (
          op?.attributes &&
          (
            op.attributes[TableTemporary.blotName] ||
            op.attributes[TableCellBlock.blotName]
          )
        ) {
          return new Delta();
        }
        // Process externally pasted lists or headers.
        if (op?.attributes?.header || op?.attributes?.list) {
          op.attributes = { ...op.attributes, ...formats };
        }
      }
    }
    return delta;
  }
}

export default TableClipboard;