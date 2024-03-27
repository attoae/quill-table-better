import downIcon from '../assets/icon/down.svg';
import eraseIcon from '../assets/icon/erase.svg';
import platteIcon from '../assets/icon/platte.svg';
import {
  createTooltip,
  setElementProperty,
  setElementAttribute
} from '../utils';

interface Attribute {
  [propName: string]: string
}

interface Child {
  category: string
  propertyName: string
  value?: string
  attribute?: Attribute
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

interface ColorList {
  value: string
  title: string
}

const options = {
  title: 'Table properties',
  properties: [
    {
      content: 'Border',
      children: [
        {
          category: 'dropdown',
          propertyName: 'border-style',
          value: '',
          options: ['dashed', 'dotted', 'double', 'groove', 'inset', 'none', 'outset', 'ridge', 'solid'],
          handler: () => {}
        },
        {
          category: 'color',
          propertyName: 'border-color',
          value: '',
          attribute: {
            type: 'text',
            placeholder: 'Color'
          },
          handler: () => {}
        },
        {
          category: 'input',
          propertyName: 'border-width',
          value: '',
          attribute: {
            type: 'text',
            placeholder: 'Width'
          },
          handler: () => {}
        }
      ]
    }
    
  ]
}

const colorList: ColorList[] = [
  { value: '#000000', title: 'Black' },
  { value: '#4d4d4d', title: 'Dim grey' },
  { value: '#808080', title: 'Grey' },
  { value: '#e6e6e6', title: 'Light grey' },
  { value: '#ffffff', title: 'White' },
  { value: '#ff0000', title: 'Red' },
  { value: '#ffa500', title: 'Orange' },
  { value: '#ffff00', title: 'Yellow' },
  { value: '#99e64d', title: 'Light green' },
  { value: '#008000', title: 'Green' },
  { value: '#7fffd4', title: 'Aquamarine' },
  { value: '#40e0d0', title: 'Turquoise' },
  { value: '#4d99e6', title: 'Light blue' },
  { value: '#0000ff', title: 'Blue' },
  { value: '#800080', title: 'Purple' }
];

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

  createColorContainer(value: string, attribute: Attribute) {
    const container = document.createElement('div');
    container.classList.add('ql-table-color-container');
    const input = this.createColorInput(attribute);
    const colorPicker = this.createColorPicker();
    // const { dropdown } = this.createDropdown(value, category);
    container.appendChild(input);
    container.appendChild(colorPicker);
    // dropdown.appendChild(colorPicker)
    // container.appendChild(dropdown);
    return container;
  }

  createColorInput(attribute: Attribute) {
    const input = this.createInput(attribute);
    input.classList.add('color-input');    
    return input;
  }

  createColorList() {
    const container = document.createElement('ul');
    const fragment = document.createDocumentFragment();
    container.classList.add('color-list');
    for (const { value, title } of colorList) {
      const li = document.createElement('li');
      const tooltip = createTooltip(title);
      li.setAttribute('data-color', value);
      setElementProperty(li, { background: value });
      li.appendChild(tooltip);
      fragment.appendChild(li);
    }
    container.appendChild(fragment);
    container.addEventListener('click', e => {
      const value = (e.target as HTMLLIElement).getAttribute('data-color');
    });
    return container;
  }

  createColorPicker() {
    const container = document.createElement('span');
    const colorButton = document.createElement('span');
    container.classList.add('color-picker');
    colorButton.classList.add('color-button');
    colorButton.classList.add('color-unselected');
    const select = this.createColorPickerSelect();
    colorButton.addEventListener('click', () => {
      this.toggleHidden(select);
    });
    container.appendChild(colorButton);
    container.appendChild(select);
    return container;
  }

  createColorPickerSelect() {
    const container = document.createElement('div');
    const eraseContainer = document.createElement('div');
    const icon = document.createElement('span');
    const button = document.createElement('button');
    const list = this.createColorList();
    icon.innerHTML = eraseIcon;
    button.innerHTML = 'Remove color';
    container.classList.add('color-picker-select', 'ql-hidden');
    eraseContainer.classList.add('erase-container');
    eraseContainer.appendChild(icon);
    eraseContainer.appendChild(button);
    container.appendChild(eraseContainer);
    container.appendChild(list);
    // container.addEventListener('blur', () => this.toggleHidden(container));
    return container;
  }

  createDropdown(value: string, category?: string) {
    const container = document.createElement('div');
    const dropText = document.createElement('span');
    const dropDown = document.createElement('span');
    switch (category) {
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
    if (category === 'dropdown') container.appendChild(dropDown);
    return { dropdown: container, dropText };
  }

  createInput(attribute: Attribute) {
    const input = document.createElement('input');
    setElementAttribute(input, attribute);
    input.classList.add('property-input');
    input.addEventListener('input', e => {
      
    });
    return input;
  }

  createList(contents: string[], dropText?: HTMLSpanElement) {
    if (!contents.length) return null;
    const container = document.createElement('ul');
    for (const content of contents) {
      const list = document.createElement('li');
      list.innerText = content;
      container.appendChild(list);
    }
    container.classList.add('ql-table-dropdown-list', 'ql-hidden');
    container.addEventListener('click', e => {
      dropText.innerText = (e.target as HTMLLIElement).innerText;
    });
    return container;
  }

  createProperty(property: Properties) {
    const { content, children } = property;
    const container = document.createElement('div');
    const label = document.createElement('label');
    label.innerText = content;
    label.classList.add('ql-table-dropdown-label');
    container.classList.add('properties-form-row');
    container.appendChild(label);
    for (const child of children) {
      const node = this.createPropertyChild(child);
      node && container.appendChild(node);
    }
    return container;
  }

  createPropertyChild(child: Child) {
    const { category, propertyName, value, attribute, options, handler } = child;
    switch (category) {
      case 'dropdown':
        const { dropdown, dropText } = this.createDropdown(value, category);
        const list = this.createList(options, dropText);
        dropdown.appendChild(list);
        dropdown.addEventListener('click', () => this.toggleHidden(list));
        return dropdown;
      case 'color':
        const colorContainer = this.createColorContainer(value, attribute);
        return colorContainer;
      case 'menus':
      
        break;
      case 'input':
        const input = this.createInput(attribute);
        return input;
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

  toggleHidden(container: HTMLElement) {
    container.classList.toggle('ql-hidden');
  }

  updatePropertiesForm() {

  }
}

export default TablePropertiesForm;