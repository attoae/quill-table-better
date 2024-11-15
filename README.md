# quill-table-better
A module that enhances the table functionality of [Quill](https://quilljs.com/).

## Compare the advantages of other table plugins
1. Supports multiple formats (include list).
2. Supports simultaneous operations on multiple cells.
3. Undo/History not break table.
4. Support language switching.
5. The toolbar provides button for inserting table.

## Demo
[quill-table-better Codepen Demo](https://codepen.io/attoae/pen/WNBGjZp)

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
quill.scrollIntoView();
```

npm
```JavaScript
import QuillTableBetter from 'quill-table-better';
import 'quill-table-better/dist/quill-table-better.css'

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
      menus: ['column', 'row', 'merge', 'table', 'cell', 'wrap', 'delete'],
      toolbarTable: true
    },
    keyboard: {
      bindings: QuillTableBetter.keyboardBindings
    }
  }
};

const quill = new Quill('#root', options);
```

cdn
```html
<link href="https://cdn.jsdelivr.net/npm/quill@2/dist/quill.snow.css" rel="stylesheet" />
<link href="https://cdn.jsdelivr.net/npm/quill-table-better@1/dist/quill-table-better.css" rel="stylesheet" />
<script src="https://cdn.jsdelivr.net/npm/quill@2/dist/quill.js"></script>
<script src="https://cdn.jsdelivr.net/npm/quill-table-better@1/dist/quill-table-better.js"></script>

<div id="root"></div>
<script>
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
        menus: ['column', 'row', 'merge', 'table', 'cell', 'wrap', 'delete'],
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
| English | en_US |
| French | fr_FR |
| Polish | pl_PL |
| German | de_DE |

2. Used to register a new language, such as:  
  { name: `'en_UK'`, content: [en_US](https://github.com/attoae/quill-table-better/blob/develop/src/language/en_US.ts) } (For content, please refer to [en_US](https://github.com/attoae/quill-table-better/blob/develop/src/language/en_US.ts))

### menus
`menus` are used to configure the action bar, and those not in the array are not displayed.  
Empty array or no configuration default all display.  
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
  menus: ['column', 'row', 'merge', 'table', 'cell', 'wrap', 'delete'],
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

## Download
```JavaScript
npm i quill-table-better
```

### CDN
```html
<link href="https://cdn.jsdelivr.net/npm/quill-table-better@1/dist/quill-table-better.css" rel="stylesheet"/>
<script src="https://cdn.jsdelivr.net/npm/quill-table-better@1/dist/quill-table-better.js"></script>
```