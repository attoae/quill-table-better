import Quill from 'quill';
import Delta from 'quill-delta';
import logger from 'quill/core/logger.js';
import type { Range } from 'quill';
import type { Props } from '../types';
import {
  TableCellBlock,
  TableThBlock,
  TableTemporary
} from '../formats/table';

const Module = Quill.import('core/module');
const Clipboard = Quill.import('modules/clipboard') as typeof Module;
const debug = logger('quill:clipboard');

class TableClipboard extends Clipboard {
  convert: ({ html, text }: {
    html?: string;
    text?: string;
  }, formats?: Record<string, unknown>) => Delta;

  onPaste(range: Range, { text, html }: { text?: string; html?: string }) {
    const formats = this.quill.getFormat(range.index) as Props;
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
      Quill.sources.SILENT
    );
    this.quill.scrollSelectionIntoView();
  }

  private getTableDelta({ html, text }: { html?: string; text?: string }, formats: Props) {
    const delta = this.convert({ text, html }, formats);
    if (formats[TableCellBlock.blotName] || formats[TableThBlock.blotName]) {
      for (const op of delta.ops) {
        // External copied tables or table contents copied within an editor.
        if (op?.attributes?.[TableTemporary.blotName]) {
          return new Delta();
        }
        // Process externally pasted lists or headers or text.
        if (
            op?.attributes?.header ||
            op?.attributes?.list ||
            !op?.attributes?.[TableCellBlock.blotName] ||
            !op?.attributes?.[TableThBlock.blotName]
        ) {
          op.attributes = { ...op.attributes, ...formats };
        }
      }
    }
    return delta;
  }
}

export default TableClipboard;