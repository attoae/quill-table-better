import Quill from 'quill';
import QuillTableBetter from '../quill-table-better';
import { ToolbarConfig } from 'quill/modules/toolbar';

Quill.register({
  'modules/table-better': QuillTableBetter
}, true);

const toolbarOptions: ToolbarConfig = [
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

export function setupQuillEditor() {
  document.body.innerHTML = '<div id="editor"></div>';
  const editorContainer = document.getElementById('editor');
  // Create a basic Quill editor instance
  const quill = new Quill(editorContainer, options);
  return quill;
}