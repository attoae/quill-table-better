# @your-org/quill-table-better

A module that enhances the table functionality of [Quill](https://quilljs.com/).

> **Note:** This is a fork of [attoae/quill-table-better](https://github.com/attoae/quill-table-better) with improvements for better instance management and memory leak prevention.

## 🚀 Fork Improvements

This fork includes several important improvements over the original:
- **Instance-specific event management** - No global event listeners for non-table instances
- **Automatic format registration** - No need for explicit registration calls
- **Memory leak prevention** - Proper cleanup of event listeners
- **Multiple instance support** - Mix table and non-table editors safely
- **Toolbar compatibility fixes** - No errors when using standard Quill features

## 📦 Installation

```bash
npm install @your-org/quill-table-better
```

## 🙏 Credits

Original work by [attoae](https://github.com/attoae). This fork maintains full compatibility while adding instance management improvements.

![quill-table-better](https://github.com/user-attachments/assets/c5304bab-84bd-4a60-b4ec-6a941a7d0c11)

## Compare the advantages of other table plugins
1. Supports multiple formats (include list、header).
2. Supports simultaneous operations on multiple cells.
3. Undo/History not break table.
4. Support language switching.
5. The toolbar provides button for inserting table.
6. Support table content is pasted overwritten.
7. Support copying and cutting table content (Select multiple cells).
8. Drag and drop the table to change its overall size (Bottom right corner of the table).

## Demo
[quill-table-better Codepen Demo(JS)](https://codepen.io/attoae/pen/WNBGjZp)  
[quill-table-better Codesandbox Demo(React)](https://codesandbox.io/p/sandbox/react-quill-wcfghd)  
[quill-table-better Codesandbox Demo(Vue)](https://codesandbox.io/p/sandbox/vue-quill-fwxplc)  
[quill-table-better Codesandbox Demo(Angular)](https://codesandbox.io/p/sandbox/angular-quill-y879sy)  
[quill-table-better Codesandbox Demo(Next)](https://codesandbox.io/p/sandbox/next-quill-l64dh2)  

## Dependencies
[quill.js](https://quilljs.com/) `>= v2.0.0`

## Quickstart
> **Note**: `setContents` causes the table to not display properly, replace with `updateContents`.  
> The method is as follows (`Used when initializing data`): 

```JavaScript
const delta = quill.clipboard.convert({ html });
const [range] = quill.selection.getRange();
quill.updateContents(delta, Quill.sources.USER);
quill.setSelection(
  delta.length() - (range?.length || 0),
  Quill.sources.SILENT
);
quill.scrollSelectionIntoView();
```

npm
```JavaScript
import Quill from 'quill';
import QuillTableBetter from 'quill-table-better';
import 'quill/dist/quill.snow.css';
import 'quill-table-better/dist/quill-table-better.css'

// Register the module class - formats will be registered automatically when needed
Quill.register({
  'modules/table-better': QuillTableBetter
}, true);

const toolbarOptions = [
  ['bold', 'italic', 'underline', 'strike'],
  ['table-better']
];

const options = {
  theme: 'snow',
  modules: {
    table: false,
    toolbar: toolbarOptions,
    'table-better': {
      language: 'en_US',
      menus: ['column', 'row', 'merge', 'table', 'cell', 'wrap', 'copy', 'delete'],
      toolbarTable: true
    },
    keyboard: {
      bindings: QuillTableBetter.keyboardBindings
    }
  }
};

const quill = new Quill('#root', options);
```

## Instance-Specific Behavior
The table-better module now uses **lazy registration** and **instance-specific event handling**:

- **Formats are registered automatically** when the first Quill instance with table-better is created
- **Global event listeners are only attached** when at least one instance uses table-better
- **Multiple instances** can coexist - some with table support, some without
- **Automatic cleanup** when all table-better instances are destroyed

```JavaScript
// Instance 1: WITH table support
const editorWithTables = new Quill('#editor1', {
  modules: {
    'table-better': { /* table options */ }
  }
});

// Instance 2: WITHOUT table support (no global events attached unnecessarily)
const simpleEditor = new Quill('#editor2', {
  modules: {
    toolbar: [['bold', 'italic']]
    // No table-better module
  }
});
```

cdn
```html
<link href="https://cdn.jsdelivr.net/npm/quill@2/dist/quill.snow.css" rel="stylesheet" />
<link href="https://cdn.jsdelivr.net/npm/quill-table-better@1/dist/quill-table-better.css" rel="stylesheet" />
<script src="https://cdn.jsdelivr.net/npm/quill@2/dist/quill.js"></script>
<script src="https://cdn.jsdelivr.net/npm/quill-table-better@1/dist/quill-table-better.js"></script>

<div id="root"></div>
<script>
  // Register the module class - formats will be registered automatically when needed
  Quill.register({
    'modules/table-better': QuillTableBetter
  }, true);

  const toolbarOptions = [
    ['bold', 'italic', 'underline', 'strike'],
    ['table-better']
  ];

  const options = {
    theme: 'snow',
    modules: {
      table: false,
      toolbar: toolbarOptions,
      'table-better': {
        language: 'en_US',
        menus: ['column', 'row', 'merge', 'table', 'cell', 'wrap', 'copy', 'delete'],
        toolbarTable: true
      },
      keyboard: {
        bindings: QuillTableBetter.keyboardBindings
      }
    }
  };
  const quill = new Quill('#root', options);
</script>
```

## Conifg

### language
The `language` parameter has two types:  
1. string, default `en_US`

| Language | Code |
| ---- | ---- |
| Chinese | zh_CN |
| Chinese(Taiwan) | zh_TW |
| English | en_US |
| French | fr_FR |
| Polish | pl_PL |
| German | de_DE |
| Russian | ru_RU |
| Turkish | tr_TR |
| Portuguese | pt_PT |
| Japanese | ja_JP |
| Brazilian Portuguese | pt_BR |
| Czech | cs_CZ |
| Danish | da_DK |
| Norwegian Bokmål | nb_NO |
| Italian | it_IT |
| Swedish | sv_SE |

2. Used to register a new language, such as:  
  { name: `'en_UK'`, content: [en_US](https://github.com/attoae/quill-table-better/blob/develop/src/language/en_US.ts) } (For content, please refer to [en_US](https://github.com/attoae/quill-table-better/blob/develop/src/language/en_US.ts))

### menus
`menus` are used to configure the action bar, and those not in the array are not displayed.  
Empty array or no configuration default all display (Except for `copy`).  
The functions of the operation bar are as follows:
1. column
  - Insert column left
  - Insert column right
  - Delete column
2. row
  - Insert row above
  - Insert row below
  - Delete row
3. merge
  - Merge cells
  - Split cell
4. table
  - Table properties
5. cell
  - Cell properties
6. wrap (Insert paragraph outside the table)
  - Insert before
  - Insert after
7. delete
  - Delete table
8. copy (Not default)
  - Copy table

In addition, the `menus` supports customization:

```JavaScript
'table-better': {
  menus: [
    { name: 'column', icon: '<span>column</span>' },
    { name: 'row', icon: '<svg></svg>' },
    'merge',
    'table',
    'cell', 
    'wrap',
    'copy',
    'delete'
  ]
}
```

### toolbarTable
`toolbarTable` is used to add a button to insert a table on the toolbar (true or false).  
And `table-better` needs to be added to toolbarOptions, for example:
 
```JavaScript
const toolbarOptions = [
  ['bold', 'italic', 'underline', 'strike'],
  ['table-better']
];
```

### toolbarButtons
`toolbarButtons` is used when focusing on the table, you can specify which buttons to disable and which not.

`whiteList` supports simultaneous operations on multiple cells, default `WHITE_LIST`. 
> **Note**: The configured `whiteList` is preferably a subset of `WHITE_LIST`, other formats may have problems.

`singleWhiteList` only supports formatting for a single cell, default `SINGLE_WHITE_LIST`.  
> **Note**: `singleWhiteList` must be a subset of `whiteList`.

```JavaScript
toolbarButtons: {
  whiteList: ['link', 'image'],
  singleWhiteList: ['link', 'image']
};
```

```JavaScript
'table-better': {
  language: 'en_US',
  menus: ['column', 'row', 'merge', 'table', 'cell', 'wrap', 'copy', 'delete'],
  toolbarButtons: {
    whiteList: ['link', 'image'],
    singleWhiteList: ['link', 'image']
  },
  toolbarTable: true
}
```

## Formats supported by table
The table supports the following formats and supports simultaneous operations on multiple cells：

```JavaScript
const WHITE_LIST = [
  'bold',
  'italic',
  'underline',
  'strike',
  'size',
  'color',
  'background',
  'font',
  'list',
  'header',
  'align',
  'link',
  'image'
];
```

Only supports formatting for a single cell.

```JavaScript
const SINGLE_WHITE_LIST = ['link', 'image'];
```

## Key combination

- delete cells and their contents (`Ctrl + Backspace` or `Ctrl + Delete`)  
When all cells in a row or column are selected, you can use key combinations to delete cells and their contents.

## Methods

```JavaScript
const module = quill.getModule('table-better');
```
### deleteTable

```JavaScript
module.deleteTable();
```
### deleteTableTemporary、hideTools
When you need to submit data(html or delta) to the server, you should use this function, for example：

```JavaScript
// Delta
module.hideTools();
const delta = quill.getContents();
axios.post(url, delta);
```

```JavaScript
// HTML
// deleteTableTemporary(source = Quill.sources.API)
module.deleteTableTemporary();
const html = quill.getSemanticHTML();
axios.post(url, html);
```
### getTable(range = this.quill.getSelection())
Function return `[table, row, cell, offset]`

```JavaScript
module.getTable();
```
### insertTable(rows: number, columns: number)
```JavaScript
module.insertTable(3, 3);
```

## Cleanup
When destroying Quill instances with table-better module, make sure to call the destroy method to clean up global event listeners:

```JavaScript
// When you need to destroy the quill instance
const tableBetterModule = quill.getModule('table-better');
if (tableBetterModule) {
  tableBetterModule.destroy();
}
```

This prevents memory leaks by removing all global event listeners that were attached by the module.

## 📈 Changelog (Fork)

### v1.3.0 (Fork Release)
- ✅ **Fixed**: Instance-specific event management using CellSelectionRegistry
- ✅ **Fixed**: Automatic format registration (lazy loading)
- ✅ **Fixed**: Toolbar compatibility for non-table Quill instances
- ✅ **Fixed**: Memory leaks from global event listeners
- ✅ **Improved**: Support for multiple Quill instances (some with/without tables)
- ✅ **Enhanced**: Proper cleanup mechanisms

### Original Package
For the original package and its changelog, see: https://github.com/attoae/quill-table-better

## Download
```JavaScript
npm i @your-org/quill-table-better
```

### CDN
```html
<link href="https://cdn.jsdelivr.net/npm/quill-table-better@1/dist/quill-table-better.css" rel="stylesheet"/>
<script src="https://cdn.jsdelivr.net/npm/quill-table-better@1/dist/quill-table-better.js"></script>
```