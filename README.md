# quill-table-better
A module that enhances the table functionality of [Quill](https://quilljs.com/).

## Dependencies
[quill.js](https://quilljs.com/) ">= v2.0.0"

## Quickstart
npm
```html
import QuillTableBetter from 'quill-table-better';
import 'quill-table-better/dist/quill-table-better.css'

Quill.register({
  'modules/table-better': QuillTableBetter
}, true);

const options = {
  theme: 'snow',
  modules: {
    table: false,
    'table-better': {},
    keyboard: {
      bindings: QuillTableBetter.keyboardBindings
    }
  }
};
```
cdn
```html
<link href="https://cdn.jsdelivr.net/npm/quill@2/dist/quill.snow.css" rel="stylesheet" />
<link href="https://cdn.jsdelivr.net/npm/quill-table-better/dist/quill-table-better.css" rel="stylesheet" />
<script src="https://cdn.jsdelivr.net/npm/quill@2/dist/quill.js"></script>
<script src="https://cdn.jsdelivr.net/npm/quill-table-better/dist/quill-table-better.js"></script>

<div id="root"></div>
<script>
  Quill.register({
    'modules/table-better': QuillTableBetter
  }, true);

  const options = {
    theme: 'snow',
    modules: {
      table: false,
      'table-better': {},
      keyboard: {
        bindings: QuillTableBetter.keyboardBindings
      }
    }
  };
  const quill = new Quill('#root', options);
</script>
```

## Conifg
```html
'table-better': {
  language: 'en_US' // 'en_US' or 'zh_CN', default 'en_US'
}
```

## Methods
```html
 const module = quill.getModule('table-better');
```
### deleteTable
```
module.deleteTable();
```
### deleteTableTemporary
When you need to submit data to the server, you should use 'module.deleteTableTemporary()',for example：
```html
module.deleteTableTemporary();
const data = quill.getContents();
axios.post(url, data);
```
### getTable(range = this.quill.getSelection())
Function return '[table, row, cell, offset]'
```html
module.getTable();
```
### insertTable(rows: number, columns: number)
```html
module.insertTable(3, 3);
```
### module.language methods
#### registry(language: string, content: Props)
Register a new language,
content can be referenced 'src/language/zh_CN.ts'.
```html
module.language.registry('zh_CN', {});
```
#### changeLanguage(language: string)
Use when registering a new language.
```html
module.language.changeLanguage('zh_CN');
```

## Download
```html
npm i quill-table-better
```

### CDN
```html
<link
  href="https://cdn.jsdelivr.net/npm/quill-table-better/dist/quill-table-better.css"
  rel="stylesheet"
/>
<script src="https://cdn.jsdelivr.net/npm/quill-table-better/dist/quill-table-better.js"></script>
```