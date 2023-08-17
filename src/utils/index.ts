import Quill from 'quill';
import { TableCell, TableCol } from '../formats/table';

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

function getElementStyle(node: Element, rules: string[]) {
  const computedStyle = getComputedStyle(node);
  return rules.reduce((styles: Properties, rule: string) => {
    styles[rule] = computedStyle.getPropertyValue(rule);
    return styles;
  }, {});
}

function getEventComposedPath(e: any) {
  const path = e.path || (e.composedPath && e.composedPath()) || [];
  if (path.length) return path;
  let target = e.target;
  path.push(target);

  while (target && target.parentNode) {
    target = target.parentNode;
    path.push(target);
  }
  return path;
}

function removeElementProperty(node: HTMLElement, properties: string[]) {
  for (const property of properties) {
    node.style.removeProperty(property);
  }
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

export {
  getComputeBounds,
  getComputeSelectedCols,
  getComputeSelectedTds,
  getCorrectBounds,
  getElementStyle,
  getEventComposedPath,
  removeElementProperty,
  setElementAttribute,
  setElementProperty
};