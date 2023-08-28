import downIcon from '../assets/icon/down.svg';

interface Child {
  type: string
  propertyName: string
  value?: string
  options?: string[]
  tooltip?: string,
  handler?: () => void
}

interface Properties {
  content: string
  children: Child[]
}

interface Options {
  title: string
  properties: Properties[]
}

const options = {
  title: 'Table properties',
  properties: [
    {
      content: 'Border',
      children: [
        {
          type: 'dropdown',
          propertyName: 'border-style',
          value: '',
          options: ['dashed', 'dotted', 'double', 'groove', 'inset', 'none', 'outset', 'ridge', 'solid'],
          handler: () => {}
        },
        {
          type: 'color',
          propertyName: 'border-color',
          value: '',
          handler: () => {}
        }
      ]
    }
    
  ]
}

class TablePropertiesForm {
  form: null;
  quill: any;
  options: Options;
  constructor(quill: any, options?: Options) {
    this.form = null;
    this.quill = quill;
    this.options = options;
    this.createPropertiesForm();
  }

  createColorInput(value: string, type: string) {
    const container = document.createElement('div');
    const input = document.createElement('input');
    input.type = 'text';
    const dropdown = this.createDropdown(value, type);
    const colorPicker = this.createColorPicker();
    dropdown.appendChild(colorPicker)
    container.appendChild(input);
    container.appendChild(dropdown);
    return container;
  }

  createColorPicker() {
    const container = document.createElement('div');
    return container;
  }

  createDropdown(value: string, type?: string) {
    const container = document.createElement('div');
    const dropText = document.createElement('span');
    const dropDown = document.createElement('span');
    switch (type) {
      case 'dropdown':
        dropDown.innerHTML = downIcon;
        dropDown.classList.add('ql-table-dropdown-icon');
        break;
      case 'color':
        break;
      default:
        break;
    }
    value && (dropText.innerText = value);
    container.classList.add('ql-table-dropdown-properties');
    dropText.classList.add('ql-table-dropdown-text');
    container.appendChild(dropText);
    if (type === 'dropdown') container.appendChild(dropDown);
    return container;
  }

  createList(contents: string[], handler: Function) {
    if (!contents.length) return null;
    const container = document.createElement('ul');
    for (const content of contents) {
      const list = document.createElement('li');
      list.innerText = content;
      list.addEventListener('click', handler.bind(this));
      container.appendChild(list);
    }
    container.classList.add('ql-table-dropdown-list', 'ql-hidden');
    return container;
  }

  createProperty(property: Properties) {
    const { content, children } = property;
    const container = document.createElement('div');
    const label = document.createElement('label');
    label.innerText = content;
    container.appendChild(label);
    for (const child of children) {
      const node = this.createPropertyChild(child);
      node && container.appendChild(node);
    }
    return container;
  }

  createPropertyChild(child: Child) {
    const { type, propertyName, value, options, handler } = child;
    switch (type) {
      case 'dropdown':
        const dropdown = this.createDropdown(value, type);
        const list = this.createList(options, handler);
        dropdown.appendChild(list);
        return dropdown;
      case 'color':
        const colorInput = this.createColorInput(value, type);
        return colorInput;
      case 'menus':
      
        break;
      default:
        break;
    }
  }

  createPropertiesForm() {
    const { title, properties } = options;
    const container = document.createElement('div');
    container.classList.add('ql-table-properties-form');
    const header = document.createElement('h2');
    header.innerText = title;
    header.classList.add('properties-form-header');
    container.appendChild(header);
    for (const property of properties) {
      const node = this.createProperty(property);
      container.appendChild(node);
    }
    this.quill.container.appendChild(container);
  }

  updatePropertiesForm() {

  }
}

export default TablePropertiesForm;