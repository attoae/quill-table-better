import eraseIcon from '../assets/icon/erase.svg';
import checkIcon from '../assets/icon/check.svg';
import downIcon from '../assets/icon/down.svg';
import platteIcon from '../assets/icon/platte.svg';
import { getProperties } from '../config';
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
  tooltip?: string
  menus?: Menus[]
  handler?: () => void
}

interface Menus {
  icon: string
  describe: string
  align: string
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
  describe: string
}

const colorList: ColorList[] = [
  { value: '#000000', describe: 'Black' },
  { value: '#4d4d4d', describe: 'Dim grey' },
  { value: '#808080', describe: 'Grey' },
  { value: '#e6e6e6', describe: 'Light grey' },
  { value: '#ffffff', describe: 'White' },
  { value: '#ff0000', describe: 'Red' },
  { value: '#ffa500', describe: 'Orange' },
  { value: '#ffff00', describe: 'Yellow' },
  { value: '#99e64d', describe: 'Light green' },
  { value: '#008000', describe: 'Green' },
  { value: '#7fffd4', describe: 'Aquamarine' },
  { value: '#40e0d0', describe: 'Turquoise' },
  { value: '#4d99e6', describe: 'Light blue' },
  { value: '#0000ff', describe: 'Blue' },
  { value: '#800080', describe: 'Purple' }
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

  createCheckBtns(menus: Menus[]) {
    const container = document.createElement('div');
    const fragment = document.createDocumentFragment();
    for (const { icon, describe, align } of menus) {
      const container = document.createElement('span');
      container.innerHTML = icon;
      container.setAttribute('data-align', align);
      container.classList.add('ql-table-tooltip-hover');
      const tooltip = createTooltip(describe);
      container.appendChild(tooltip);
      fragment.appendChild(container);
    }
    container.classList.add('ql-table-check-container');
    container.appendChild(fragment);
    container.addEventListener('click', e => {
      const target = (e.target as HTMLElement).closest('span.ql-table-tooltip-hover');
      const value = target.getAttribute('data-align');
    });
    return container;
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
    const container = this.createInput(attribute);
    container.classList.add('label-field-view-color');    
    return container;
  }

  createColorList() {
    const container = document.createElement('ul');
    const fragment = document.createDocumentFragment();
    container.classList.add('color-list');
    for (const { value, describe } of colorList) {
      const li = document.createElement('li');
      const tooltip = createTooltip(describe);
      li.setAttribute('data-color', value);
      li.classList.add('ql-table-tooltip-hover');
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
    const { placeholder = '' } = attribute;
    const container = document.createElement('div');
    const wrapper = document.createElement('div');
    const label = document.createElement('label');
    const input = document.createElement('input');
    const status = document.createElement('div');
    container.classList.add('label-field-view');
    wrapper.classList.add('label-field-view-input-wrapper')
    label.innerText = placeholder;
    setElementAttribute(input, attribute);
    input.classList.add('property-input');
    input.addEventListener('input', e => {
      
    });
    status.classList.add('label-field-view-status', 'ql-hidden');
    wrapper.appendChild(input);
    wrapper.appendChild(label);
    container.appendChild(wrapper);
    container.appendChild(status);
    return container;
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
    if (children.length === 1) {
      container.classList.add('properties-form-row-full');
    }
    container.appendChild(label);
    for (const child of children) {
      const node = this.createPropertyChild(child);
      node && container.appendChild(node);
    }
    return container;
  }

  createPropertyChild(child: Child) {
    const { category, propertyName, value, attribute, options, menus, handler } = child;
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
        const checkBtns = this.createCheckBtns(menus);
        return checkBtns;
      case 'input':
        const input = this.createInput(attribute);
        return input;
      default:
        break;
    }
  }

  createPropertiesForm(type: string = 'cell') {
    const { title, properties } = getProperties(type);
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