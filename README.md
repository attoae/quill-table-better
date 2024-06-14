# quill-table-better
A module that enhances the table functionality of [Quill](https://quilljs.com/).

## Demo
[quill-table-better Codepen Demo](https://codepen.io/attoae/pen/WNBGjZp)

## Dependencies
[quill.js](https://quilljs.com/) ">= v2.0.0"

## Quickstart
$\color{red}{notice}$
```html
const delta = quill.clipboard.convert({
  html,
  text: '\n'
})
quill.setContents(delta, Quill.sources.USER);

// The above method causes the table to not display properly
// Please use the following method instead
const [range] = quill.selection.getRange();
quill.updateContents(delta, Quill.sources.USER);
quill.setSelection(
  delta.length() - range.length,
  Quill.sources.SILENT,
);
quill.scrollIntoView();
```

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
<link href="https://cdn.jsdelivr.net/npm/quill-table-better@1.0.0-dev.3/dist/quill-table-better.css" rel="stylesheet" />
<script src="https://cdn.jsdelivr.net/npm/quill@2/dist/quill.js"></script>
<script src="https://cdn.jsdelivr.net/npm/quill-table-better@1.0.0-dev.3/dist/quill-table-better.js"></script>

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
### deleteTableTemporary、hideTools
When you need to submit data(html or delta) to the server, you should use this function,for example：
```html
// Delta
module.hideTools();
const delta = quill.getContents();
axios.post(url, delta);
```

```html
// HTML
module.deleteTableTemporary();
const html = quill.getSemanticHTML();
axios.post(url, html);
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
  href="https://cdn.jsdelivr.net/npm/quill-table-better@1.0.0-dev.3/dist/quill-table-better.css"
  rel="stylesheet"
/>
<script src="https://cdn.jsdelivr.net/npm/quill-table-better@1.0.0-dev.3/dist/quill-table-better.js"></script>
```