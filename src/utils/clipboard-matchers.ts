import Delta from 'quill-delta';
import extend from 'extend';

interface Formats {
  [propName: string]: string
}

const TABLE_ATTRIBUTE = ['border', 'cellspacing', 'style'];

function applyFormat(delta: Delta, format: Formats | string, value?: any): Delta {
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
      extend({}, { [format]: value }, op.attributes)
    );
  }, new Delta());
}

function matchTable(node: any, delta: Delta) {
  const table =
    node.parentNode.tagName === 'TABLE'
      ? node.parentNode
      : node.parentNode.parentNode;
  const rows = Array.from(table.querySelectorAll('tr'));
  const row = rows.indexOf(node) + 1;
  if (!node.innerHTML.replace(/\s/g, '')) return new Delta();
  return applyFormat(delta, 'table-cell', row);
}

function matchTableCell(node: any, delta: Delta) {
  const table =
    node.parentNode.parentNode.tagName === 'TABLE'
      ? node.parentNode.parentNode
      : node.parentNode.parentNode.parentNode;
  const rows = Array.from(table.querySelectorAll('tr'));
  const cells = Array.from(node.parentNode.querySelectorAll('td'));
  const row = node.parentNode.getAttribute('data-row') || rows.indexOf(node.parentNode) + 1;
  const cell = cells.indexOf(node) + 1;
  if (!delta.length()) delta.insert('\n', { 'table-cell': { 'data-row': row } });
  delta.ops.forEach(op => {
    if (op.attributes && op.attributes['table-cell']) {
      op.attributes['table-cell'] = { ...op.attributes['table-cell'], 'data-row': row };
    }
  })
  return applyFormat(delta, 'table-cell-block', cell);
}

function matchTableTemporary(node: HTMLElement, delta: Delta) {
  const formats = TABLE_ATTRIBUTE.reduce((formats: Formats, attr) => {
    if (node.hasAttribute(attr)) {
      formats[attr] = node.getAttribute(attr);
    }
    return formats;
  }, {});
  return new Delta()
    .insert('\n', { 'table-temporary': formats })
    .concat(delta);
}

export {
  matchTable,
  matchTableCell,
  matchTableTemporary
}