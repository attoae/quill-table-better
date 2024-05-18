# quill-table-better
A module that enhances the table functionality of [Quill](https://quilljs.com/).

## Dependencies
[quill.js](https://quilljs.com/) ">= v2.0.0"

## Quickstart
```html
import QuillTableBetter from 'quill-table-better';

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

## Download

### CDN