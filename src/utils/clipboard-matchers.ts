import Delta from 'quill-delta';
import merge from 'lodash.merge';
import { filterWordStyle } from './';
import { TableCell } from '../formats/table';

const TABLE_ATTRIBUTE = ['border', 'cellspacing', 'style'];

function applyFormat(delta: Delta, format: Props | string, value?: any): Delta {
  if (typeof format === 'object') {
    return Object.keys(format).reduce((newDelta, key) => {
      return applyFormat(newDelta, key, format[key]);
    }, delta);
  }
  return delta.reduce((newDelta, op) => {
    if (op.attributes && op.attributes[format]) {
      return newDelta.push(op);
    }
    return newDelta.insert(
      op.insert,
      merge({}, { [format]: value }, op.attributes)
    );
  }, new Delta());
}

function matchTable(node: HTMLTableRowElement, delta: Delta) {
  const table =
    (node.parentNode as HTMLElement).tagName === 'TABLE'
      ? node.parentNode
      : node.parentNode.parentNode;
  const rows = Array.from(table.querySelectorAll('tr'));
  const row = rows.indexOf(node) + 1;
  if (!node.innerHTML.replace(/\s/g, '')) return new Delta();
  return applyFormat(delta, 'table-cell', row);
}

function matchTableCell(node: HTMLTableCellElement, delta: Delta) {
  const table =
    (node.parentNode.parentNode as HTMLElement).tagName === 'TABLE'
      ? node.parentNode.parentNode
      : node.parentNode.parentNode.parentNode;
  const rows = Array.from(table.querySelectorAll('tr'));
  const tagName = node.tagName;
  const cells = Array.from(node.parentNode.querySelectorAll(tagName));
  const row =
    (node.parentNode as HTMLTableRowElement).getAttribute('data-row') ||
    rows.indexOf((node.parentNode as HTMLTableRowElement)) + 1;
  const cellId = node?.firstElementChild?.getAttribute('data-cell') || cells.indexOf(node) + 1;
  if (!delta.length()) delta.insert('\n', { 'table-cell': { 'data-row': row } });
  delta.ops.forEach(op => {
    if (op.attributes && op.attributes['table-cell']) {
      // @ts-ignore
      op.attributes['table-cell'] = { ...op.attributes['table-cell'], 'data-row': row };
    }
  });
  return applyFormat(matchTableTh(node, delta, row), 'table-cell-block', cellId);
}

function matchTableCol(node: HTMLElement, delta: Delta) {
  let span = ~~node.getAttribute('span') || 1;
  const width = node.getAttribute('width');
  const newDelta = new Delta();
  while (span > 1) {
    newDelta.insert('\n', { 'table-col': { width } });
    span--;
  }
  return newDelta.concat(delta);
}

function matchTableTemporary(node: HTMLElement, delta: Delta) {
  const formats = TABLE_ATTRIBUTE.reduce((formats: Props, attr) => {
    if (node.hasAttribute(attr)) {
      formats[attr] = filterWordStyle(node.getAttribute(attr));
    }
    return formats;
  }, {});
  return new Delta()
    .insert('\n', { 'table-temporary': formats })
    .concat(delta);
}

function matchTableTh(node: HTMLTableCellElement, delta: Delta, row: string | number) {
  const formats = TableCell.formats(node);
  if (node.tagName === 'TH') {
    delta.ops.forEach(op => {
      if (
        typeof op.insert === 'string' &&
        !op.insert.endsWith('\n')
      ) {
        op.insert += '\n';
      }
    });
    return applyFormat(delta, 'table-cell', { ...formats, 'data-row': row });
  }
  return delta;
}

export {
  matchTable,
  matchTableCell,
  matchTableCol,
  matchTableTemporary
}