import Quill from 'quill';
import QuillTableBetter from '../src/quill-table-better';
import 'quill/dist/quill.snow.css';
import '../src/assets/css/quill-table-better.scss';

Quill.register({
  'modules/table-better': QuillTableBetter
}, true);

const toolbarOptions = [
  ['bold', 'italic', 'underline', 'strike'],        // toggled buttons
  ['blockquote', 'code-block'],
  ['link', 'image', 'video', 'formula'],

  [{ 'header': 1 }, { 'header': 2 }],               // custom button values
  [{ 'list': 'ordered'}, { 'list': 'bullet' }, { 'list': 'check' }],
  [{ 'script': 'sub'}, { 'script': 'super' }],      // superscript/subscript
  [{ 'indent': '-1'}, { 'indent': '+1' }],          // outdent/indent
  [{ 'direction': 'rtl' }],                         // text direction

  [{ 'size': ['small', false, 'large', 'huge'] }],  // custom dropdown
  [{ 'header': [1, 2, 3, 4, 5, 6, false] }],

  [{ 'color': [] }, { 'background': [] }],          // dropdown with defaults from theme
  [{ 'font': [] }],
  [{ 'align': [] }],

  ['clean']                                         // remove formatting button
];

const options = {
  theme: 'snow',
  modules: {
    toolbar: toolbarOptions,
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