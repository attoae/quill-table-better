import eraseIcon from '../assets/icon/erase.svg';
import checkIcon from '../assets/icon/check.svg';
import downIcon from '../assets/icon/down.svg';
import platteIcon from '../assets/icon/platte.svg';
import saveIcon from '../assets/icon/save.svg';
import closeIcon from '../assets/icon/close.svg';
import { getProperties } from '../config';
import {
  createTooltip,
  debounce,
  getClosestElement,
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
  type: string
  attribute: Attribute
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

const actionList = [
  { icon: saveIcon, label: 'Save', action: '' },
  { icon: closeIcon, label: 'Cancel', action: '' }
];

class TablePropertiesForm {
  tableMenus: any;
  options: Options;
  form: HTMLDivElement;
  attrs: Attribute;
  constructor(tableMenus: any, options?: Options) {
    this.tableMenus = tableMenus;
    this.options = options;
    this.form = this.createPropertiesForm(options);
    this.attrs = { ...options.attribute };
  }

  createActionBtns() {
    const container = document.createElement('div');
    const fragment = document.createDocumentFragment();
    container.classList.add('properties-form-action-row');
    for (const { icon, label } of actionList) {
      const button = document.createElement('button');
      const iconContainer = document.createElement('span');
      const labelContainer = document.createElement('span');
      iconContainer.innerHTML = icon;
      labelContainer.innerText = label;
      button.appendChild(iconContainer);
      button.appendChild(labelContainer);
      fragment.appendChild(button);
    }
    container.appendChild(fragment);
    return container;
  }

  createCheckBtns(menus: Menus[], propertyName: string) {
    const container = document.createElement('div');
    const fragment = document.createDocumentFragment();
    for (const { icon, describe, align } of menus) {
      const container = document.createElement('span');
      container.innerHTML = icon;
      container.setAttribute('data-align', align);
      container.classList.add('ql-table-tooltip-hover');
      if (this.options.attribute[propertyName] === align) {
        container.classList.add('ql-table-btns-checked');
      }
      const tooltip = createTooltip(describe);
      container.appendChild(tooltip);
      fragment.appendChild(container);
    }
    container.classList.add('ql-table-check-container');
    container.appendChild(fragment);
    container.addEventListener('click', e => {
      const target: HTMLSpanElement = (
        e.target as HTMLElement
      ).closest('span.ql-table-tooltip-hover');
      const value = target.getAttribute('data-align');
      this.switchButton(container, target);
      this.setAttribute(propertyName, value);
    });
    return container;
  }

  createColorContainer(attribute: Attribute, propertyName: string, value: string) {
    const container = document.createElement('div');
    container.classList.add('ql-table-color-container');
    const input = this.createColorInput(attribute, propertyName, value);
    const colorPicker = this.createColorPicker(value);
    container.appendChild(input);
    container.appendChild(colorPicker);
    return container;
  }

  createColorInput(attribute: Attribute, propertyName: string, value: string) {
    const container = this.createInput(attribute, propertyName, value);
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
      const target = e.target as HTMLLIElement;
      const value = (
        target.tagName === 'DIV'
          ? target.parentElement
          : target
      ).getAttribute('data-color');
      this.updateSelectColor(this.getColorClosest(container), value);
    });
    return container;
  }

  createColorPicker(value: string) {
    const container = document.createElement('span');
    const colorButton = document.createElement('span');
    container.classList.add('color-picker');
    colorButton.classList.add('color-button');
    if (value) {
      setElementProperty(colorButton, { 'background-color': value });
    } else {
      colorButton.classList.add('color-unselected');
    }
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
    button.addEventListener('click', () => {
      this.updateSelectColor(this.getColorClosest(container), '');
    });
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

  createInput(attribute: Attribute, propertyName: string, value: string) {
    const { placeholder = '' } = attribute;
    const container = document.createElement('div');
    const wrapper = document.createElement('div');
    const label = document.createElement('label');
    const input = document.createElement('input');
    const status = document.createElement('div');
    container.classList.add('label-field-view');
    wrapper.classList.add('label-field-view-input-wrapper');
    label.innerText = placeholder;
    // if (value) setElementProperty(label, { display: 'block' });
    setElementAttribute(input, attribute);
    input.classList.add('property-input');
    input.value = value;
    input.addEventListener('input', e => {
      // debounce
      const value = (e.target as HTMLInputElement).value;
      this.setAttribute(propertyName, value, container);
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
        const colorContainer = this.createColorContainer(attribute, propertyName, value);
        return colorContainer;
      case 'menus':
        const checkBtns = this.createCheckBtns(menus, propertyName);
        return checkBtns;
      case 'input':
        const input = this.createInput(attribute, propertyName, value);
        return input;
      default:
        break;
    }
  }

  createPropertiesForm(options: Options) {
    const { title, properties } = getProperties(options);
    const container = document.createElement('div');
    container.classList.add('ql-table-properties-form');
    const header = document.createElement('h2');
    const actions = this.createActionBtns();
    header.innerText = title;
    header.classList.add('properties-form-header');
    container.appendChild(header);
    for (const property of properties) {
      const node = this.createProperty(property);
      container.appendChild(node);
    }
    container.appendChild(actions);
    this.tableMenus.quill.container.appendChild(container);
    return container;
  }

  getColorClosest(container: HTMLElement) {
    return getClosestElement(container, '.ql-table-color-container');
  }

  removePropertiesForm() {
    this.form.remove();
  }

  setAttribute(propertyName: string, value: string, container?: HTMLElement) {
    this.attrs[propertyName] = value;
    if (propertyName.includes('-color')) {
      this.updateSelectColor(this.getColorClosest(container), value);
    }
  }

  switchButton(container: HTMLDivElement, target: HTMLSpanElement) {
    const children = container.querySelectorAll('span.ql-table-tooltip-hover');
    for (const child of children) {
      child.classList.remove('ql-table-btns-checked');
    }
    target.classList.add('ql-table-btns-checked');
  }

  toggleHidden(container: HTMLElement) {
    container.classList.toggle('ql-hidden');
  }

  updatePropertiesForm() {

  }

  updateSelectColor(element: Element, value: string) {
    const input: HTMLInputElement = element.querySelector('.property-input');
    const colorButton: HTMLElement = element.querySelector('.color-button');
    const colorPickerSelect: HTMLElement = element.querySelector('.color-picker-select');
    if (!value) {
      colorButton.classList.add('color-unselected');
    } else {
      colorButton.classList.remove('color-unselected');
    }
    input.value = value;
    setElementProperty(colorButton, { 'background-color': value });
    colorPickerSelect.classList.add('ql-hidden');
  }
}

export default TablePropertiesForm;