import Quill from 'quill';
import type {
  Props,
  TableCell,
  TableCellBlock,
  TableContainer,
  TableHeader,
  TableList,
  TableMenus,
  UseLanguageHandler
} from '../types';
import eraseIcon from '../assets/icon/erase.svg';
import downIcon from '../assets/icon/down.svg';
import paletteIcon from '../assets/icon/palette.svg';
import saveIcon from '../assets/icon/save.svg';
import closeIcon from '../assets/icon/close.svg';
import { getProperties } from '../config';
import {
  addDimensionsUnit,
  createTooltip,
  getClosestElement,
  getComputeSelectedCols,
  getCorrectContainerWidth,
  getCorrectWidth,
  isDimensions,
  isValidColor,
  setElementProperty,
  setElementAttribute
} from '../utils';
import { ListContainer } from '../formats/list';
import iro from '@jaames/iro';

interface Child {
  category: string;
  propertyName: string;
  value?: string;
  attribute?: Props;
  options?: string[];
  tooltip?: string;
  menus?: Menus[];
  valid?: (value?: string) => boolean;
  message?: string;
}

interface Menus {
  icon: string;
  describe: string;
  align: string;
}

interface Properties {
  content: string;
  children: Child[];
}

interface Options {
  type: string;
  attribute: Props;
}

interface ColorList {
  value: string;
  describe: string;
}

const ACTION_LIST = [
  { icon: saveIcon, label: 'save' },
  { icon: closeIcon, label: 'cancel' }
];

const COLOR_LIST: ColorList[] = [
  { value: '#000000', describe: 'black' },
  { value: '#4d4d4d', describe: 'dimGrey' },
  { value: '#808080', describe: 'grey' },
  { value: '#e6e6e6', describe: 'lightGrey' },
  { value: '#ffffff', describe: 'white' },
  { value: '#ff0000', describe: 'red' },
  { value: '#ffa500', describe: 'orange' },
  { value: '#ffff00', describe: 'yellow' },
  { value: '#99e64d', describe: 'lightGreen' },
  { value: '#008000', describe: 'green' },
  { value: '#7fffd4', describe: 'aquamarine' },
  { value: '#40e0d0', describe: 'turquoise' },
  { value: '#4d99e6', describe: 'lightBlue' },
  { value: '#0000ff', describe: 'blue' },
  { value: '#800080', describe: 'purple' }
];

class TablePropertiesForm {
  tableMenus: TableMenus;
  options: Options;
  attrs: Props;
  borderForm: HTMLElement[];
  saveButton: HTMLButtonElement;
  form: HTMLDivElement;
  constructor(tableMenus: TableMenus, options?: Options) {
    this.tableMenus = tableMenus;
    this.options = options;
    this.attrs = { ...options.attribute };
    this.borderForm = [];
    this.saveButton = null;
    this.form = this.createPropertiesForm(options); 
  }

  checkBtnsAction(status: string) {
    if (status === 'save') {
      this.saveAction(this.options.type);
    }
    this.removePropertiesForm();
    this.tableMenus.showMenus();
    this.tableMenus.updateMenus();
  }

  createActionBtns(listener: EventListener, showLabel: boolean) {
    const useLanguage = this.getUseLanguage();
    const container = document.createElement('div');
    const fragment = document.createDocumentFragment();
    container.classList.add('properties-form-action-row');
    for (const { icon, label } of ACTION_LIST) {
      const button = document.createElement('button');
      const iconContainer = document.createElement('span');
      iconContainer.innerHTML = icon;
      button.appendChild(iconContainer);
      setElementAttribute(button, { label });
      if (showLabel) {
        const labelContainer = document.createElement('span');
        labelContainer.innerText = useLanguage(label);
        button.appendChild(labelContainer);
      }
      fragment.appendChild(button);
    }
    container.addEventListener('click', e => listener(e));
    container.appendChild(fragment);
    return container;
  }

  createCheckBtns(child: Child) {
    const { menus, propertyName } = child;
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

  createColorContainer(child: Child) {
    const container = document.createElement('div');
    container.classList.add('ql-table-color-container');
    const input = this.createColorInput(child);
    const colorPicker = this.createColorPicker(child);
    container.appendChild(input);
    container.appendChild(colorPicker);
    return container;
  }

  createColorInput(child: Child) {
    const container = this.createInput(child);
    container.classList.add('label-field-view-color');    
    return container;
  }

  createColorList(propertyName: string) {
    const useLanguage = this.getUseLanguage();
    const container = document.createElement('ul');
    const fragment = document.createDocumentFragment();
    container.classList.add('color-list');
    for (const { value, describe } of COLOR_LIST) {
      const li = document.createElement('li');
      const tooltip = createTooltip(useLanguage(describe));
      li.setAttribute('data-color', value);
      li.classList.add('ql-table-tooltip-hover');
      setElementProperty(li, { 'background-color': value });
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
      this.setAttribute(propertyName, value, container);
      this.updateInputStatus(container, false, true);
    });
    return container;
  }

  createColorPicker(child: Child) {
    const { propertyName, value } = child;
    const container = document.createElement('span');
    const colorButton = document.createElement('span');
    container.classList.add('color-picker');
    colorButton.classList.add('color-button');
    if (value) {
      setElementProperty(colorButton, { 'background-color': value });
    } else {
      colorButton.classList.add('color-unselected');
    }
    const select = this.createColorPickerSelect(propertyName);
    colorButton.addEventListener('click', () => {
      this.toggleHidden(select);
      const colorContainer = this.getColorClosest(container);
      const input: HTMLInputElement = colorContainer?.querySelector('.property-input');
      this.updateSelectedStatus(select, input?.value, 'color');
    });
    container.appendChild(colorButton);
    container.appendChild(select);
    return container;
  }

  createColorPickerIcon(svg: string, text: string, listener: EventListener) {
    const container = document.createElement('div');
    const icon = document.createElement('span');
    const button = document.createElement('button');
    icon.innerHTML = svg;
    button.innerText = text;
    container.classList.add('erase-container');
    container.appendChild(icon);
    container.appendChild(button);
    container.addEventListener('click', listener);
    return container;
  }

  createColorPickerSelect(propertyName: string) {
    const useLanguage = this.getUseLanguage();
    const container = document.createElement('div');
    const remove = this.createColorPickerIcon(
      eraseIcon,
      useLanguage('removeColor'),
      () => {
        this.setAttribute(propertyName, '', container);
        this.updateInputStatus(container, false, true);
      }
    );
    const list = this.createColorList(propertyName);
    const palette = this.createPalette(propertyName, useLanguage, container);
    container.classList.add('color-picker-select', 'ql-hidden');
    container.appendChild(remove);
    container.appendChild(list);
    container.appendChild(palette);
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

  createInput(child: Child) {
    const { attribute, message, propertyName, value, valid } = child;
    const { placeholder = '' } = attribute;
    const container = document.createElement('div');
    const wrapper = document.createElement('div');
    const label = document.createElement('label');
    const input = document.createElement('input');
    const status = document.createElement('div');
    container.classList.add('label-field-view');
    wrapper.classList.add('label-field-view-input-wrapper');
    label.innerText = placeholder;
    setElementAttribute(input, attribute);
    input.classList.add('property-input');
    input.value = value;
    input.addEventListener('input', e => {
      // debounce
      const value = (e.target as HTMLInputElement).value;
      valid && this.switchHidden(status, valid(value));
      this.updateInputStatus(wrapper, valid && !valid(value));
      this.setAttribute(propertyName, value, container);
    });
    status.classList.add('label-field-view-status', 'ql-hidden');
    message && (status.innerText = message);
    wrapper.appendChild(input);
    wrapper.appendChild(label);
    container.appendChild(wrapper);
    valid && container.appendChild(status);
    return container;
  }

  createList(child: Child, dropText?: HTMLSpanElement) {
    const { options, propertyName } = child;
    if (!options.length) return null;
    const container = document.createElement('ul');
    for (const option of options) {
      const list = document.createElement('li');
      list.innerText = option;
      container.appendChild(list);
    }
    container.classList.add('ql-table-dropdown-list', 'ql-hidden');
    container.addEventListener('click', e => {
      const value = (e.target as HTMLLIElement).innerText;
      dropText.innerText = value;
      this.toggleBorderDisabled(value);
      this.setAttribute(propertyName, value);
    });
    return container;
  }

  createPalette(propertyName: string, useLanguage: UseLanguageHandler, parent: HTMLElement) {
    const container = document.createElement('div');
    const palette = document.createElement('div');
    const wrap = document.createElement('div');
    const iroContainer = document.createElement('div');
    // @ts-ignore
    const colorPicker = new iro.ColorPicker(iroContainer, {
      width: 110,
      layout: [
        { 
          component: iro.ui.Wheel,
          options: {}
        }
      ]
    });
    const eraseContainer = this.createColorPickerIcon(
      paletteIcon,
      useLanguage('colorPicker'),
      () => this.toggleHidden(palette)
    );
    const btns = this.createActionBtns(
      (e: MouseEvent) => {
        const target = (e.target as HTMLElement).closest('button');
        if (!target) return;
        const label = target.getAttribute('label');
        if (label === 'save') {
          this.setAttribute(
            propertyName,
            colorPicker.color.hexString,
            parent
          );
          this.updateInputStatus(container, false, true);
        }
        palette.classList.add('ql-hidden');
        parent.classList.add('ql-hidden');
      },
      false
    );
    palette.classList.add('color-picker-palette', 'ql-hidden');
    wrap.classList.add('color-picker-wrap')
    iroContainer.classList.add('iro-container');
    wrap.appendChild(iroContainer);
    wrap.appendChild(btns);
    palette.appendChild(wrap);
    container.appendChild(eraseContainer);
    container.appendChild(palette);
    return container;
  }

  createProperty(property: Properties) {
    const { content, children } = property;
    const useLanguage = this.getUseLanguage();
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
      if (node && content === useLanguage('border')) {
        this.borderForm.push(node);
      }
    }
    return container;
  }

  createPropertyChild(child: Child) {
    const { category, value } = child;
    switch (category) {
      case 'dropdown':
        const { dropdown, dropText } = this.createDropdown(value, category);
        const list = this.createList(child, dropText);
        dropdown.appendChild(list);
        dropdown.addEventListener('click', () => {
          this.toggleHidden(list);
          this.updateSelectedStatus(dropdown, dropText.innerText, 'dropdown');
        });
        return dropdown;
      case 'color':
        const colorContainer = this.createColorContainer(child);
        return colorContainer;
      case 'menus':
        const checkBtns = this.createCheckBtns(child);
        return checkBtns;
      case 'input':
        const input = this.createInput(child);
        return input;
      default:
        break;
    }
  }

  createPropertiesForm(options: Options) {
    const useLanguage = this.getUseLanguage();
    const { title, properties } = getProperties(options, useLanguage);
    const container = document.createElement('div');
    container.classList.add('ql-table-properties-form');
    const header = document.createElement('h2');
    const actions = this.createActionBtns(
      (e: MouseEvent) => {
        const target = (e.target as HTMLElement).closest('button');
        target && this.checkBtnsAction(target.getAttribute('label'));
      },
      true
    );
    header.innerText = title;
    header.classList.add('properties-form-header');
    container.appendChild(header);
    for (const property of properties) {
      const node = this.createProperty(property);
      container.appendChild(node);
    }
    container.appendChild(actions);
    this.setBorderDisabled();
    this.tableMenus.quill.container.appendChild(container);
    this.updatePropertiesForm(container, options.type);
    this.setSaveButton(actions);
    container.addEventListener('click', (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      this.hiddenSelectList(target);
    });
    return container;
  }

  getCellStyle(td: Element, attrs: Props) {
    const style = (td.getAttribute('style') || '')
      .split(';')
      .filter((value: string) => value.trim())
      .reduce((style: Props, value: string) => {
        const arr = value.split(':');
        return { ...style, [arr[0].trim()]: arr[1].trim() };
      }, {});
    Object.assign(style, attrs);
    return Object.keys(style).reduce((value: string, key: string) => {
      return value += `${key}: ${style[key]}; `;
    }, '');
  }

  getColorClosest(container: HTMLElement) {
    return getClosestElement(container, '.ql-table-color-container');
  }

  getComputeBounds(type: string) {
    if (type === 'table') {
      const { table } = this.tableMenus;
      const [tableBounds, containerBounds] = this.tableMenus.getCorrectBounds(table);
      if (tableBounds.bottom > containerBounds.bottom) {
        return { ...tableBounds, bottom: containerBounds.height };
      }
      return tableBounds;
    } else {
      const { computeBounds } = this.tableMenus.getSelectedTdsInfo();
      return computeBounds;
    }
  }

  getDiffProperties() {
    const change = this.attrs;
    const old = this.options.attribute;
    return Object.keys(change).reduce((attrs: Props, key) => {
      if (change[key] !== old[key]) {
        attrs[key] =
          isDimensions(key)
            ? addDimensionsUnit(change[key])
            : change[key];
      }
      return attrs;
    }, {});
  }

  getUseLanguage() {
    const { language } = this.tableMenus.tableBetter;
    const useLanguage = language.useLanguage.bind(language);
    return useLanguage;
  }

  getViewportSize() {
    return {
      viewWidth: document.documentElement.clientWidth,
      viewHeight: document.documentElement.clientHeight
    }
  }

  hiddenSelectList(element: HTMLElement) {
    const listClassName = '.ql-table-dropdown-properties';
    const colorClassName = '.color-picker';
    const list = this.form.querySelectorAll('.ql-table-dropdown-list');
    const colorPicker = this.form.querySelectorAll('.color-picker-select');
    for (const node of [...list, ...colorPicker]) {
      if (
        node.closest(listClassName)?.isEqualNode(element.closest(listClassName)) ||
        node.closest(colorClassName)?.isEqualNode(element.closest(colorClassName))
      ) {
        continue;
      }
      node.classList.add('ql-hidden');
    }
  }

  removePropertiesForm() {
    this.form.remove();
    this.borderForm = [];
  }

  saveAction(type: string) {
    switch (type) {
      case 'table':
        this.saveTableAction();
        break;
      default:
        this.saveCellAction();
        break;
    }
  }

  saveCellAction() {
    const { selectedTds } = this.tableMenus.tableBetter.cellSelection;
    const { quill, table } = this.tableMenus;
    const tableBlot = Quill.find(table) as TableContainer;
    const colgroup = tableBlot.colgroup();
    const isPercent = tableBlot.isPercent();
    const attrs = this.getDiffProperties();
    const floatW = parseFloat(attrs['width']);
    const width = 
      attrs['width']?.endsWith('%')
        ? floatW * getCorrectContainerWidth() / 100
        : floatW;
    const align = attrs['text-align'];
    align && delete attrs['text-align'];
    const newSelectedTds = [];
    if (colgroup && width) {
      delete attrs['width'];
      const { operateLine } = this.tableMenus.tableBetter;
      const { computeBounds } = this.tableMenus.getSelectedTdsInfo();
      const cols = getComputeSelectedCols(computeBounds, table, quill.container);
      for (const col of cols) {
        operateLine.setColWidth(col as HTMLElement, `${width}`, isPercent);
      }
    }
    for (const td of selectedTds) {
      const tdBlot = Quill.find(td) as TableCell;
      const blotName = tdBlot.statics.blotName;
      const formats = tdBlot.formats()[blotName];
      const style = this.getCellStyle(td, attrs);
      if (align) {
        const _align = align === 'left' ? '' : align;
        tdBlot.children.forEach((child: TableCellBlock | ListContainer | TableHeader) => {
          if (child.statics.blotName === ListContainer.blotName) {
            child.children.forEach((ch: TableList) => {
              ch.format && ch.format('align', _align);
            });
          } else {
            child.format('align', _align);
          }
        });
      }
      const parent = tdBlot.replaceWith(blotName, { ...formats, style }) as TableCell;
      newSelectedTds.push(parent.domNode);
    }
    this.tableMenus.tableBetter.cellSelection.setSelectedTds(newSelectedTds);
    if (!isPercent) this.updateTableWidth(table, tableBlot, isPercent);
  }

  saveTableAction() {
    const { table, tableBetter } = this.tableMenus;
    const temporary = (Quill.find(table) as TableContainer).temporary()?.domNode;
    const td = table.querySelector('td,th');
    const attrs = this.getDiffProperties();
    const align = attrs['align'];
    delete attrs['align'];
    switch (align) {
      case 'center':
        Object.assign(attrs, { 'margin': '0 auto' });
        break;
      case 'left':
        Object.assign(attrs, { 'margin': '' });
        break;
      case 'right':
        Object.assign(attrs, { 'margin-left': 'auto', 'margin-right': '' });
        break;
      default:
        break;
    }
    setElementProperty(temporary || table, attrs);
    tableBetter.cellSelection.setSelected(td);
  }

  setAttribute(propertyName: string, value: string, container?: HTMLElement) {
    this.attrs[propertyName] = value;
    if (propertyName.includes('-color')) {
      this.updateSelectColor(this.getColorClosest(container), value);
    }
  }

  setBorderDisabled() {
    const [borderContainer] = this.borderForm;
    // @ts-ignore
    const borderStyle = borderContainer.querySelector('.ql-table-dropdown-text').innerText;
    this.toggleBorderDisabled(borderStyle);
  }

  setSaveButton(container: HTMLDivElement) {
    const saveButton: HTMLButtonElement = container.querySelector('button[label="save"]');
    this.saveButton = saveButton;
  }

  setSaveButtonDisabled(disabled: boolean) {
    if (!this.saveButton) return;
    if (disabled) {
      this.saveButton.setAttribute('disabled', 'true');
    } else {
      this.saveButton.removeAttribute('disabled');
    }
  }

  switchButton(container: HTMLDivElement, target: HTMLSpanElement) {
    const children = container.querySelectorAll('span.ql-table-tooltip-hover');
    for (const child of children) {
      child.classList.remove('ql-table-btns-checked');
    }
    target.classList.add('ql-table-btns-checked');
  }

  switchHidden(container: HTMLElement, valid: boolean) {
    if (!valid) {
      container.classList.remove('ql-hidden');
    } else {
      container.classList.add('ql-hidden');
    }
  }

  toggleBorderDisabled(value: string) {
    const [, colorContainer, widthContainer] = this.borderForm;
    if (value === 'none' || !value) {
      this.attrs['border-color'] = '';
      this.attrs['border-width'] = '';
      this.updateSelectColor(colorContainer, '');
      this.updateInputValue(widthContainer, '');
      colorContainer.classList.add('ql-table-disabled');
      widthContainer.classList.add('ql-table-disabled');
    } else {
      colorContainer.classList.remove('ql-table-disabled');
      widthContainer.classList.remove('ql-table-disabled');
    }
  }

  toggleHidden(container: HTMLElement) {
    container.classList.toggle('ql-hidden');
  }

  updateInputValue(element: Element, value: string) {
    const input: HTMLInputElement = element.querySelector('.property-input');
    input.value = value;
  }

  updateInputStatus(container: HTMLElement, status: boolean, isColor?: boolean) {
    const closestContainer =
      isColor
        ? this.getColorClosest(container)
        : getClosestElement(container, '.label-field-view');
      const wrapper = closestContainer.querySelector('.label-field-view-input-wrapper');
    if (status) {
      wrapper.classList.add('label-field-view-error');
      this.setSaveButtonDisabled(true);
    } else { 
      wrapper.classList.remove('label-field-view-error');
      const wrappers = this.form.querySelectorAll('.label-field-view-error');
      if (!wrappers.length) this.setSaveButtonDisabled(false);
    }
  }

  updatePropertiesForm(container: HTMLElement, type: string) {
    container.classList.remove('ql-table-triangle-none');
    const { height, width } = container.getBoundingClientRect();
    const containerBounds = this.tableMenus.quill.container.getBoundingClientRect();
    const { top, left, right, bottom } = this.getComputeBounds(type);
    const { viewHeight } = this.getViewportSize();
    let correctTop = bottom + 10;
    let correctLeft = (left + right - width) >> 1;
    if (correctTop + containerBounds.top + height > viewHeight) {
      correctTop = top - height - 10;
      if (correctTop < 0) {
        correctTop = (containerBounds.height - height) >> 1;
        container.classList.add('ql-table-triangle-none');
      } else {
        container.classList.add('ql-table-triangle-up');
        container.classList.remove('ql-table-triangle-down');
      }
    } else {
      container.classList.add('ql-table-triangle-down');
      container.classList.remove('ql-table-triangle-up');
    }
    if (correctLeft < containerBounds.left) {
      correctLeft = 0;
      container.classList.add('ql-table-triangle-none');
    } else if (correctLeft + width > containerBounds.right) {
      correctLeft = containerBounds.right - width;
      container.classList.add('ql-table-triangle-none');
    }
    setElementProperty(container, {
      left: `${correctLeft}px`,
      top: `${correctTop}px`
    });
  }

  updateSelectColor(element: Element, value: string) {
    const input: HTMLInputElement = element.querySelector('.property-input');
    const colorButton: HTMLElement = element.querySelector('.color-button');
    const colorPickerSelect: HTMLElement = element.querySelector('.color-picker-select');
    const status: HTMLElement = element.querySelector('.label-field-view-status');
    if (!value) {
      colorButton.classList.add('color-unselected');
    } else {
      colorButton.classList.remove('color-unselected');
    }
    input.value = value;
    setElementProperty(colorButton, { 'background-color': value });
    colorPickerSelect.classList.add('ql-hidden');
    this.switchHidden(status, isValidColor(value));
  }

  updateSelectedStatus(container: HTMLDivElement, value: string, type: string) {
    const selectors = type === 'color' ? '.color-list' : '.ql-table-dropdown-list';
    const list = container.querySelector(selectors);
    if (!list) return;
    const lists = Array.from(list.querySelectorAll('li'));
    for (const list of lists) {
      list.classList.remove(`ql-table-${type}-selected`);
    }
    const selected = lists.find(li => {
      const data = type === 'color' ? li.getAttribute('data-color') : li.innerText;
      return data === value;
    });
    selected && selected.classList.add(`ql-table-${type}-selected`);
  }

  updateTableWidth(table: HTMLElement, tableBlot: TableContainer, isPercent: boolean) {
    const temporary = tableBlot.temporary();
    setElementProperty(table, { width: 'auto' });
    const { width } = table.getBoundingClientRect();
    table.style.removeProperty('width');
    setElementProperty(temporary.domNode, {
      width: getCorrectWidth(width, isPercent)
    });
  }
}

export default TablePropertiesForm;