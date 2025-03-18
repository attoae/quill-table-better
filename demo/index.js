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

  ['clean'],                                        // remove formatting button
  ['table-better']
];

const options = {
  theme: 'snow',
  modules: {
    toolbar: toolbarOptions,
    table: false,
    'table-better': {
      toolbarTable: true
    },
    keyboard: {
      bindings: QuillTableBetter.keyboardBindings
    }
  }
};

const editor = new Quill('#root', options);
const tableModule = editor.getModule('table-better');
const btn1 = document.getElementById('btn1');
const btn2 = document.getElementById('btn2');
const btn3 = document.getElementById('btn3');
const btn4 = document.getElementById('btn4');
const btn5 = document.getElementById('btn5');
const deltaData = document.getElementById('deltaData');
let delta = null;
let html = '';
btn1.onclick = () => {
  tableModule.insertTable(3, 3);
}
btn2.onclick = () => {
  html = editor.getSemanticHTML();
  delta = editor.getContents();
  deltaData.innerHTML = JSON.stringify(delta);
}
btn3.onclick = () => {
  if (!delta) return;
  editor.setContents(delta, Quill.sources.USER);
}
btn4.onclick = () => {
  if (!html) return;
  delta = editor.clipboard.convert({
    html,
    text: '\n'
  })
  editor.setContents(delta, Quill.sources.USER);
}
btn5.onclick = () => {
  if (!delta) return;
  const [range] = editor.selection.getRange();
  editor.updateContents(delta, Quill.sources.USER);
  editor.setSelection(
    delta.length() - range.length,
    Quill.sources.SILENT,
  );
  editor.scrollSelectionIntoView();
}
