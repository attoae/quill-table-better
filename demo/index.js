import Quill from 'quill';
import QuillTableBetter from '../src/quill-table-better';
import 'quill/dist/quill.snow.css';
import '../src/assets/css/quill-table-better.scss';

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

const editor = new Quill('#root', options);
const tableModule = editor.getModule('table-better');
const btn = document.getElementById('btn');
btn.onclick = () => {
  tableModule.insertTable(3, 3);
}