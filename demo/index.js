import Quill from 'quill';
import QuillTableBetter from '../src/quill-table-better';
import 'quill/dist/quill.snow.css';

Quill.register({
  'modules/table-better': QuillTableBetter
}, true);

var options = {
  theme: 'snow',
  modules: {
    table: false,
    'table-better': {}
  }
};

var editor = new Quill('#root', options);