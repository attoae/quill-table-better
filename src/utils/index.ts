import Quill from 'quill';
import { TableCell, TableCol } from '../formats/table';
import { colors } from '../config';

interface Properties {
  [propertyName: string]: string
}

interface CorrectBound {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width?: number;
  height?: number;
}

const DEVIATION = 2;

function addDimensionsUnit(value: string) {
  const unit = value.slice(-2); // 'px' or 'em'
  if (unit !== 'px' && unit !== 'em') {
    return value + 'px';
  }
  return value;
}

function convertUnitToInteger(withUnit: string) {
  if (typeof withUnit !== 'string') return withUnit;
  const unit = withUnit.slice(-2); // 'px' or 'em'
  const numberPart = withUnit.slice(0, -2);
  const integerPart = Math.round(parseFloat(numberPart));
  return `${integerPart}${unit}`;
}

function createTooltip(content: string) {
  const element = document.createElement('div');
  element.innerText = content;
  element.classList.add('ql-table-tooltip', 'ql-hidden');
  return element;
}

function debounce(cb: Function, delay: number) {
  let timer: NodeJS.Timeout = null;
  return function () {
    let context = this;
    let args = arguments;
    if(timer) clearTimeout(timer);
    timer = setTimeout(function () {
      cb.apply(context, args);
    }, delay);
  }
}

function filterWordStyle(s: string) {
  return s.replace(/mso.*?;/g, '');
}

function getClosestElement(element: HTMLElement, selector: string) {
  return element.closest(selector);
}

function getComputeBounds(startCorrectBounds: CorrectBound, endCorrectBounds: CorrectBound) {
  const left = Math.min(startCorrectBounds.left, endCorrectBounds.left);
  const right = Math.max(startCorrectBounds.right, endCorrectBounds.right);
  const top = Math.min(startCorrectBounds.top, endCorrectBounds.top);
  const bottom = Math.max(startCorrectBounds.bottom, endCorrectBounds.bottom);
  return { left, right, top, bottom }
}

function getComputeSelectedCols(
  computeBounds: CorrectBound,
  table: Element,
  container: Element
) {
  const tableParchment = Quill.find(table);
  const cols = tableParchment.descendants(TableCol);
  let correctLeft = 0;
  return cols.reduce((selectedCols: Element[], col: TableCol) => {
    const { left, width } = getCorrectBounds(col.domNode, container);
    correctLeft = correctLeft ? correctLeft : left;
    if (
      correctLeft + DEVIATION >= computeBounds.left &&
      correctLeft - DEVIATION + width <= computeBounds.right
    ) {
      selectedCols.push(col.domNode);
    }
    correctLeft += width;
    return selectedCols;
  }, []);
}

function getComputeSelectedTds(
  computeBounds: CorrectBound,
  table: Element,
  container: Element,
  type?: string
): Element[] {
  const tableParchment = Quill.find(table);
  const tableCells = tableParchment.descendants(TableCell);
  return tableCells.reduce((selectedTds: Element[], tableCell: TableCell) => {
    const { left, top, width, height } = getCorrectBounds(tableCell.domNode, container);
    switch (type) {
      case 'column':
        if (
          left + DEVIATION >= computeBounds.left &&
          left - DEVIATION + width <= computeBounds.right
        ) {
          selectedTds.push(tableCell.domNode);
        }
        break;
      case 'row':
        break;
      default:
        if (
          left + DEVIATION >= computeBounds.left &&
          left - DEVIATION + width <= computeBounds.right &&
          top + DEVIATION >= computeBounds.top &&
          top - DEVIATION + height <= computeBounds.bottom
        ) {
          selectedTds.push(tableCell.domNode);
        }
        break;
    }
    return selectedTds;
  }, []);
}

function getCorrectBounds(target: Element, container: Element) {
  const targetBounds = target.getBoundingClientRect();
  const containerBounds = container.getBoundingClientRect();
  const left = targetBounds.left - containerBounds.left - container.scrollLeft;
  const top = targetBounds.top - containerBounds.top - container.scrollTop;
  const width = targetBounds.width;
  const height = targetBounds.height;
  return {
    left,
    top,
    width,
    height,
    right: left + width,
    bottom: top + height
  }
}

function getElementStyle(node: HTMLElement, rules: string[]) {
  const computedStyle = getComputedStyle(node);
  const style = node.style;
  return rules.reduce((styles: Properties, rule: string) => {
    styles[rule] = rgbToHex(
      style.getPropertyValue(rule) ||
      computedStyle.getPropertyValue(rule)
    );
    return styles;
  }, {});
}

function isDimensions(key: string) {
  if (key.endsWith('width') || key.endsWith('height')) return true;
  return false;
}

function isSimpleColor(color: string) {
  for (const col of colors) {
    if (col === color) return true;
  }
  return false;
}

function isValidColor(color: string) {
  if (!color) return true;
  const hexRegex = /^#([A-Fa-f0-9]{3,6})$/;
  const rgbRegex = /^rgb\((\d{1,3}), (\d{1,3}), (\d{1,3})\)$/;
  // const rgbaRegex = /^rgba\((\d{1,3}), (\d{1,3}), (\d{1,3}), (\d{1,3})\)$/;
  if (hexRegex.test(color)) {
    return true;
  } else if (rgbRegex.test(color)) {
    return true;
  }
  return isSimpleColor(color);
}

function isValidDimensions(value: string) {
  if (!value) return true;
  const unit = value.slice(-2); // 'px' or 'em'
  if (unit !== 'px' && unit !== 'em') {
    return !/[a-z]/.test(unit) && !isNaN(parseFloat(unit));
  }
  return true;
}

function removeElementProperty(node: HTMLElement, properties: string[]) {
  for (const property of properties) {
    node.style.removeProperty(property);
  }
}

function rgbToHex(value: string) {
  if (value.startsWith('rgba(')) return rgbaToHex(value);
  if (!value.startsWith('rgb(')) return value;
  value = value.replace(/^[^\d]+/, '').replace(/[^\d]+$/, '');
  const hex = value
    .split(',')
    .map(component => `00${parseInt(component, 10).toString(16)}`.slice(-2))
    .join('');
  return `#${hex}`;
}

function rgbaToHex(value: string) {
  value = value.replace(/^[^\d]+/, '').replace(/[^\d]+$/, '');
  const r = Math.round(+value[0]);
  const g = Math.round(+value[1]);
  const b = Math.round(+value[2]);
  const a = Math.round(+value[3] * 255).toString(16).toUpperCase().padStart(2, '0');
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1) + a;
}

function setElementAttribute(node: Element, attributes: Properties) {
  for (const attribute in attributes) {
    node.setAttribute(attribute, attributes[attribute]);
  }
}

function setElementProperty(node: HTMLElement, properties: Properties) {
  const style = node.style;
  if (!style) {
    node.setAttribute('style', properties.toString());
    return;
  }
  for (const propertyName in properties) {
    style.setProperty(propertyName, properties[propertyName]);
  }
}

function throttle(cb: Function, delay: number) {
  let last = 0
  return function () {
    let context = this;
    let args = arguments;
    let now = +new Date();
    if (now - last >= delay) {
      last = now;
      cb.apply(context, args);
    }
  }
}

function throttleStrong(cb: Function, delay: number) {
  let last = 0, timer: NodeJS.Timeout = null;
  return function () { 
    let context = this;
    let args = arguments;
    let now = +new Date();
    if (now - last < delay) {
      clearTimeout(timer);
      timer = setTimeout(function () {
        last = now;
        cb.apply(context, args);
      }, delay);
    } else {
      last = now;
      cb.apply(context, args);
    }
  }
}

export {
  addDimensionsUnit,
  convertUnitToInteger,
  createTooltip,
  debounce,
  filterWordStyle,
  getClosestElement,
  getComputeBounds,
  getComputeSelectedCols,
  getComputeSelectedTds,
  getCorrectBounds,
  getElementStyle,
  isDimensions,
  isValidColor,
  isValidDimensions,
  removeElementProperty,
  rgbToHex,
  rgbaToHex,
  setElementAttribute,
  setElementProperty,
  throttle,
  throttleStrong
};