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
  line: HTMLElement | null;
  box: HTMLElement | null;
  direction: string | null;
  constructor(quill: any, options: Options) {
    this.quill = quill;
    this.options = options;
    this.drag = false;
    this.line = null;
    this.box = null;
    this.direction = null; // 1.level 2.vertical
    this.createOperateLine();
    this.createOperateBox();
  }

  createOperateLine() {
    const container = document.createElement('div');
    const line = document.createElement('div');
    container.classList.add('ql-operate-line-container');
    line.classList.add('ql-operate-line');
    const { containerProps, lineProps } = this.getProperty(this.options);
    if (!containerProps || !lineProps) return;
    setElementProperty(container, containerProps);
    setElementProperty(line, lineProps);
    container.appendChild(line);
    this.quill.container.appendChild(container);
    this.line = container;
    this.updateCell(container);
  }

  createOperateBox() {
    const box = document.createElement('div');
    box.classList.add('ql-operate-box');
    const { boxProps } = this.getProperty(this.options);
    setElementProperty(box, boxProps);
    this.box = box;
    this.quill.container.appendChild(box);
  }

  getProperty(options: Options) {
    const { tableNode, cellNode, mousePosition } = options;
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
      left: `${tableRect.right - rootRect.left}px`,
      display: 'block'
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
    } else {
      this.hideLine();
    }
    return { boxProps };
  }

  updateProperty(options: Options) {
    const { containerProps, lineProps, boxProps } = this.getProperty(options);
    if (!containerProps || !lineProps) return;
    setElementProperty(this.line, containerProps);
    setElementProperty(this.line.firstChild as HTMLElement, lineProps);
    setElementProperty(this.box, boxProps);
    this.updateCell(this.line);
  }

  setCellRect(cell: Element, clientX: number, clientY: number) {
    if (this.direction === 'level') {
      this.setCellLevelRect(cell, clientX);
    } else if (this.direction === 'vertical') {
      this.setCellVerticalRect(cell, clientY);
    }
  }

  setCellLevelRect(cell: Element, clientX: number) {
    // this.line
  }

  setCellVerticalRect(cell: Element, clientY: number) {
    // this.line
  }

  updateCell(node: Element) {
    if (!node) return;
    function handleDrag(e: MouseEvent) {
      e.preventDefault();
      if (this.drag) {
        const { cellNode } = this.options;
        this.setCellRect(cellNode, e.clientX, e.clientY);
      }
    }

    function handleMouseup(e: MouseEvent) {
      e.preventDefault();
      this.drag = false;
      document.removeEventListener('mousemove', handleDrag, false);
      document.removeEventListener('mouseup', handleMouseup, false);
    }

    function handleMousedown(e: MouseEvent) {
      e.preventDefault();
      this.drag = true;
      document.addEventListener('mousemove', handleDrag, false);
      document.addEventListener('mouseup', handleMouseup, false);
    }
    node.addEventListener('mousedown', handleMousedown, false);
  }

  hideLine() {
    setElementProperty(this.line, { display: 'none' });
  }

  hideBox() {
    setElementProperty(this.box, { display: 'none' });
  }
}

export default OperateLine;