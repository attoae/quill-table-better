import Quill from 'quill';
import { setElementProperty } from '../utils';
interface Options {
  tableNode: Element
  cellNode: Element
  mousePosition: {
    clientX: number
    clientY: number
  }
}
const LINE_CONTAINER_WIDTH = 5;
const LINE_CONTAINER_HEIGHT = 5;
const BOX_WIDTH = 8;
const BOX_HEIGHT = 8;
class OperateLine {
  quill: any;
  options: Options;
  drag: boolean;
  domNode: Element | null;
  direction: string | null;
  constructor(quill: any, options: Options) {
    this.quill = quill;
    this.options = options;
    this.drag = false;
    this.domNode = null;
    this.direction = null; // 1.level 2.vertical
    this.createOperateLine();
    this.createOperateBox();
  }

  createOperateLine() {
    const container = document.createElement('div');
    const line = document.createElement('div');
    container.classList.add('ql-operate-line-container');
    line.classList.add('ql-operate-line');
    const { containerProps, lineProps } = this.getProperty();
    if (!containerProps || !lineProps) return;
    setElementProperty(container, containerProps);
    setElementProperty(line, lineProps);
    container.appendChild(line);
    this.quill.container.appendChild(container);
    this.updateCell(container);
  }

  createOperateBox() {
    const box = document.createElement('div');
    box.classList.add('ql-operate-box');
    const { boxProps } = this.getProperty();
    setElementProperty(box, boxProps);
    this.quill.container.appendChild(box);
  }

  getProperty() {
    const { tableNode, cellNode, mousePosition } = this.options;
    const { clientX, clientY } = mousePosition;
    const tableRect = tableNode.getBoundingClientRect();
    const cellRect = cellNode.getBoundingClientRect();
    const rootRect = this.quill.root.getBoundingClientRect();
    const x = cellRect.left + cellRect.width;
    const y = cellRect.top + cellRect.height;
    const boxProps = {
      width: `${BOX_WIDTH}px`,
      height: `${BOX_HEIGHT}px`,
      top: `${tableRect.bottom - rootRect.top}px`,
      left: `${tableRect.right - rootRect.left}px`
    }
    if (Math.abs(x - clientX) <= 5) {
      this.direction = 'level';
      return {
        boxProps,
        containerProps: {
          width: `${LINE_CONTAINER_WIDTH}px`,
          height: `${tableRect.height}px`,
          top: `${tableRect.top - rootRect.top}px`,
          left: `${x - rootRect.left - LINE_CONTAINER_WIDTH / 2}px`,
          display: 'flex',
          cursor: 'col-resize'
        },
        lineProps: {
          width: '1px',
          height: '100%'
        }
      }
    } else if (Math.abs(y - clientY) <= 5) {
      this.direction = 'vertical';
      return {
        boxProps,
        containerProps: {
          width: `${tableRect.width}px`,
          height: `${LINE_CONTAINER_HEIGHT}px`,
          top: `${y - rootRect.top - LINE_CONTAINER_HEIGHT / 2}px`,
          left: `${tableRect.left - rootRect.left}px`,
          display: 'flex',
          cursor: 'row-resize'
        },
        lineProps: {
          width: '100%',
          height: '1px'
        }
      }
    }
    return { boxProps };
  }

  setCellRect(cell: Element, table: Element, clientX: number, clientY: number) {
    if (this.direction === 'level') {
      this.setCellLevelRect(cell, table, clientX);
    } else if (this.direction === 'vertical') {
      this.setCellVerticalRect(cell, table, clientY);
    }
  }

  setCellLevelRect(cell: Element, table: Element, clientX: number) {
    
  }

  setCellVerticalRect(cell: Element, table: Element, clientY: number) {
    
  }

  updateCell(node: Element) {
    function handleDrag(e: MouseEvent) {
      e.preventDefault();
      const { tableNode, cellNode } = this.options;
      this.setCellRect(cellNode, tableNode, e.clientX, e.clientY);
    }

    function handleMouseup(e: MouseEvent) {
      e.preventDefault();
      document.removeEventListener('mousemove', handleDrag, false);
      document.removeEventListener('mouseup', handleMouseup, false);
    }

    function handleMousedown(e: MouseEvent) {
      e.preventDefault();
      document.addEventListener('mousemove', handleDrag, false);
      document.addEventListener('mouseup', handleMouseup, false);
    }
    node && node.addEventListener('mousedown', handleMousedown, false);
  }
}

export default OperateLine;