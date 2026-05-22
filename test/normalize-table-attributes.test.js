/**
 * Tests for normalizeTableAttributes utility.
 *
 * When delta ops are round-tripped through a server (e.g. Python's orjson,
 * or any JSON serializer that doesn't preserve key order), the attribute
 * keys on table ops can arrive in an arbitrary order.  Quill's applyDelta
 * iterates Object.keys(attributes), and table blots require line formats
 * (table-cell-block, table-th-block) to be processed BEFORE their container
 * formats (table-cell, table-th).  If the container format is processed
 * first, Parchment calls TableCell.create() without a value, causing:
 *
 *   TypeError: undefined is not an object (evaluating 'Object.keys(e)')
 *
 * normalizeTableAttributes reorders the attributes so line formats always
 * come before container formats, making the module robust against any
 * server-side key reordering.
 *
 * Run: node test/normalize-table-attributes.test.js
 */

// Inline the function to keep the test self-contained (no build step needed).
// This is an exact copy of the logic in src/utils/index.ts.

function normalizeTableAttributes(ops) {
  var LINE_FORMATS = ['table-cell-block', 'table-th-block'];
  var CONTAINER_FORMATS = ['table-cell', 'table-th'];

  return ops.map(function (op) {
    var attrs = op.attributes;
    if (!attrs) return op;

    var hasLineFormat = LINE_FORMATS.some(function (f) { return f in attrs; });
    var hasContainerFormat = CONTAINER_FORMATS.some(function (f) { return f in attrs; });
    if (!hasLineFormat || !hasContainerFormat) return op;

    var keys = Object.keys(attrs);
    var needsReorder = false;
    for (var i = 0; i < LINE_FORMATS.length; i++) {
      var lineKey = LINE_FORMATS[i];
      var containerKey = CONTAINER_FORMATS[i];
      if (lineKey in attrs && containerKey in attrs) {
        if (keys.indexOf(containerKey) < keys.indexOf(lineKey)) {
          needsReorder = true;
          break;
        }
      }
    }
    if (!needsReorder) return op;

    var reordered = {};
    var lineSet = new Set(LINE_FORMATS);
    var containerSet = new Set(CONTAINER_FORMATS);
    keys.forEach(function (k) {
      if (!lineSet.has(k) && !containerSet.has(k)) {
        reordered[k] = attrs[k];
      }
    });
    LINE_FORMATS.forEach(function (k) {
      if (k in attrs) reordered[k] = attrs[k];
    });
    CONTAINER_FORMATS.forEach(function (k) {
      if (k in attrs) reordered[k] = attrs[k];
    });
    return Object.assign({}, op, { attributes: reordered });
  });
}

// ── helpers ──────────────────────────────────────────────────────────

function attrKeys(op) {
  return Object.keys(op.attributes || {});
}

function assert(condition, message) {
  if (!condition) {
    throw new Error('FAIL: ' + message);
  }
}

function assertDeepEqual(actual, expected, message) {
  var a = JSON.stringify(actual);
  var e = JSON.stringify(expected);
  if (a !== e) {
    throw new Error('FAIL: ' + message + '\n  expected: ' + e + '\n  actual:   ' + a);
  }
}

var passed = 0;
var failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log('  \u2713 ' + name);
  } catch (e) {
    failed++;
    console.error('  \u2717 ' + name);
    console.error('    ' + e.message);
  }
}

// ── tests ────────────────────────────────────────────────────────────

console.log('normalizeTableAttributes');

test('passes through ops without attributes unchanged', function () {
  var ops = [{ insert: 'hello' }, { insert: '\n' }];
  var result = normalizeTableAttributes(ops);
  assertDeepEqual(result, ops, 'ops should be unchanged');
});

test('passes through ops with only line format (no container)', function () {
  var ops = [
    { insert: '\n', attributes: { 'table-cell-block': 'cell-abc' } }
  ];
  var result = normalizeTableAttributes(ops);
  assertDeepEqual(result, ops, 'ops should be unchanged');
});

test('passes through ops with only container format (no line)', function () {
  var ops = [
    { insert: '\n', attributes: { 'table-cell': { 'data-row': 'row-123' } } }
  ];
  var result = normalizeTableAttributes(ops);
  assertDeepEqual(result, ops, 'ops should be unchanged');
});

test('preserves correct order: table-cell-block before table-cell', function () {
  var ops = [{
    insert: '\n',
    attributes: {
      'table-cell-block': 'cell-abc',
      'table-cell': { 'data-row': 'row-123' }
    }
  }];
  var result = normalizeTableAttributes(ops);
  // Already correct order — should return same object reference
  assert(result[0] === ops[0], 'should return same object when order is correct');
});

test('reorders: table-cell before table-cell-block → fixed', function () {
  // This is the bug case: container format before line format
  var ops = [{
    insert: '\n',
    attributes: {
      'table-cell': { 'data-row': 'row-zft5' },
      'table-cell-block': 'cell-audy'
    }
  }];
  var result = normalizeTableAttributes(ops);
  var keys = attrKeys(result[0]);
  var lineIdx = keys.indexOf('table-cell-block');
  var containerIdx = keys.indexOf('table-cell');
  assert(lineIdx < containerIdx,
    'table-cell-block (' + lineIdx + ') should come before table-cell (' + containerIdx + ')');
  // Values must be preserved
  assertDeepEqual(result[0].attributes['table-cell-block'], 'cell-audy', 'line format value');
  assertDeepEqual(result[0].attributes['table-cell'], { 'data-row': 'row-zft5' }, 'container format value');
});

test('reorders: table-th before table-th-block → fixed', function () {
  var ops = [{
    insert: '\n',
    attributes: {
      'table-th': { 'data-row': 'row-abc' },
      'table-th-block': 'cell-xyz'
    }
  }];
  var result = normalizeTableAttributes(ops);
  var keys = attrKeys(result[0]);
  assert(keys.indexOf('table-th-block') < keys.indexOf('table-th'),
    'table-th-block should come before table-th');
});

test('preserves other attributes and their relative order', function () {
  var ops = [{
    insert: '\n',
    attributes: {
      'bold': true,
      'table-cell': { 'data-row': 'row-1' },
      'color': '#ff0000',
      'table-cell-block': 'cell-1'
    }
  }];
  var result = normalizeTableAttributes(ops);
  var keys = attrKeys(result[0]);
  // bold and color should come first (in their original relative order)
  assert(keys.indexOf('bold') < keys.indexOf('color'), 'bold before color');
  // Then line format, then container format
  assert(keys.indexOf('color') < keys.indexOf('table-cell-block'), 'color before table-cell-block');
  assert(keys.indexOf('table-cell-block') < keys.indexOf('table-cell'), 'table-cell-block before table-cell');
});

test('handles multiple ops, only reorders those that need it', function () {
  var ops = [
    { insert: 'text' },
    {
      insert: '\n',
      attributes: {
        'table-cell-block': 'cell-ok',
        'table-cell': { 'data-row': 'row-ok' }
      }
    },
    {
      insert: '\n',
      attributes: {
        'table-cell': { 'data-row': 'row-bad' },
        'table-cell-block': 'cell-bad'
      }
    },
    { insert: '\n', attributes: { 'header': 1 } }
  ];
  var result = normalizeTableAttributes(ops);
  // First op: no attributes, same reference
  assert(result[0] === ops[0], 'plain text op unchanged');
  // Second op: already correct order, same reference
  assert(result[1] === ops[1], 'correctly ordered op unchanged');
  // Third op: was reordered
  assert(result[2] !== ops[2], 'misordered op should be new object');
  var keys = attrKeys(result[2]);
  assert(keys.indexOf('table-cell-block') < keys.indexOf('table-cell'),
    'reordered op has correct key order');
  // Fourth op: no table formats, same reference
  assert(result[3] === ops[3], 'non-table op unchanged');
});

test('preserves insert value during reorder', function () {
  var ops = [{
    insert: '\n',
    attributes: {
      'table-cell': { 'data-row': 'row-1' },
      'table-cell-block': 'cell-1'
    }
  }];
  var result = normalizeTableAttributes(ops);
  assert(result[0].insert === '\n', 'insert value preserved');
});

// ── summary ──────────────────────────────────────────────────────────

console.log('\n' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);
