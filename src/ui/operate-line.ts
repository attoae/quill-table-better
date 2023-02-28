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
  dragTable: HTMLElement | null;
  direction: string | null;
  constructor(quill: any, options: Options) {
    this.quill = quill;
    this.options = options;
    this.drag = false;
    this.line = null;
    this.box = null;
    this.dragTable = null;
    this.direction = null; // 1.level 2.vertical
    this.createOperateLine();
    this.createOperateBox();
  }

  createOperateLine() {
    const container = document.createElement('div');
    const line = document.createElement('div');
    container.classList.add('ql-operate-line-container');
    const { containerProps, lineProps } = this.getProperty(this.options);
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
    this.updateCell(box);
  }

  createDragTable(table: Element) {
    const dragTable = document.createElement('div');
    const properties = this.getDragTableProperty(table);
    dragTable.classList.add('ql-operate-drag-table');
    setElementProperty(dragTable, properties);
    this.dragTable = dragTable;
    this.quill.container.appendChild(dragTable);
  }

  getProperty(options: Options) {
    const containerRect = this.quill.container.getBoundingClientRect();
    const { tableNode, cellNode, mousePosition } = options;
    const { clientX, clientY } = mousePosition;
    const tableRect = tableNode.getBoundingClientRect();
    const cellRect = cellNode.getBoundingClientRect();
    const x = cellRect.left + cellRect.width;
    const y = cellRect.top + cellRect.height;
    const boxProps = {
      width: `${BOX_WIDTH}px`,
      height: `${BOX_HEIGHT}px`,
      top: `${tableRect.bottom - containerRect.top}px`,
      left: `${tableRect.right - containerRect.left}px`,
      display: 'block'
    }
    if (Math.abs(x - clientX) <= 5) {
      this.direction = 'level';
      return {
        boxProps,
        containerProps: {
          width: `${LINE_CONTAINER_WIDTH}px`,
          height: `${containerRect.height}px`,
          top: '0',
          left: `${x - containerRect.left - LINE_CONTAINER_WIDTH / 2}px`,
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
          width: `${containerRect.width}px`,
          height: `${LINE_CONTAINER_HEIGHT}px`,
          top: `${y - containerRect.top - LINE_CONTAINER_HEIGHT / 2}px`,
          left: '0',
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

  getDragTableProperty(table: Element) {
    const { left, top, width, height } = table.getBoundingClientRect();
    const containerRect = this.quill.container.getBoundingClientRect();
    return {
      left: `${left - containerRect.left}px`,
      top: `${top - containerRect.top}px`,
      width: `${width}px`,
      height: `${height}px`,
      display: 'block'
    }
  }

  updateProperty(options: Options) {
    const { containerProps, lineProps, boxProps } = this.getProperty(options);
    if (!containerProps || !lineProps) return;
    this.options = options;
    setElementProperty(this.line, containerProps);
    setElementProperty(this.line.firstChild as HTMLElement, lineProps);
    setElementProperty(this.box, boxProps);
  }

  setCellRect(cell: Element, clientX: number, clientY: number) {
    if (this.direction === 'level') {
      this.setCellLevelRect(cell, clientX);
    } else if (this.direction === 'vertical') {
      this.setCellVerticalRect(cell, clientY);
    }
  }

  setCellLevelRect(cell: Element, clientX: number) {
    const { right } = cell.getBoundingClientRect();
    const change = ~~(clientX - right);
    const cols = this.getLevelColNum(cell);
    const rows = cell.parentElement.parentElement.children;
    const isLastCell = cell.nextElementSibling == null;
    const preNodes: [Element, string][] = [];
    for (const row of rows) {
      const cells = row.children;
      if (isLastCell) {
        const cell = cells[cells.length - 1];
        const { width } = cell.getBoundingClientRect();
        preNodes.push([cell, `${~~(width + change)}`]);
        continue;
      }
      let nums = 0;
      for (const cell of cells) {
        const colspan = ~~cell.getAttribute('colspan') || 1;
        nums += colspan;
        if (nums > cols) break;
        if (nums === cols) {
          const { width } = cell.getBoundingClientRect();
          const nextCell = cell.nextElementSibling;
          if (!nextCell) continue;
          const { width: nextWidth } = nextCell.getBoundingClientRect();
          preNodes.push([cell, `${~~(width + change)}`], [nextCell, `${~~(nextWidth - change)}`]);
        }
      }
    }
    for (const [node, width] of preNodes) {
      node.setAttribute('width', width);
    }
  }

  getLevelColNum(cell: Element) {
    let previousNode = cell;
    let nums = 0;
    while (previousNode) {
      const colspan = ~~previousNode.getAttribute('colspan') || 1;
      nums += colspan;
      // @ts-ignore
      previousNode = previousNode.previousSibling;
    }
    return nums;
  }

  setCellVerticalRect(cell: Element, clientY: number) {
    const rowspan = ~~cell.getAttribute('rowspan') || 1;
    const cells = rowspan > 1 ? this.getVerticalCells(cell, rowspan) : cell.parentElement.children;
    for (const cell of cells) {
      const { top } = cell.getBoundingClientRect();
      cell.setAttribute('height', `${~~(clientY - top)}`);
    }
  }

  updateDragLine(clientX: number, clientY: number) {
    const containerRect = this.quill.container.getBoundingClientRect();
    if (this.direction === 'level') {
      setElementProperty(this.line, { left: `${~~(clientX - containerRect.left - LINE_CONTAINER_WIDTH / 2)}px` });
    } else if (this.direction === 'vertical') {
      setElementProperty(this.line, { top: `${(~~clientY - containerRect.top - LINE_CONTAINER_HEIGHT / 2)}px` });
    }
  }

  getVerticalCells(cell: Element, rowspan: number) {
    let row = cell.parentElement;
    while (rowspan > 1 && row) {
      // @ts-ignore
      row = row.nextSibling;
      rowspan--;
    }
    return row.children;
  }

  toggleLineChildClass(isAdd: boolean) {
    const node = this.line.firstElementChild;
    if (isAdd) {
      node.classList.add('ql-operate-line');
    } else {
      node.classList.remove('ql-operate-line');
    }
  }

  isLine(node: Element) {
    return node.classList.contains('ql-operate-line-container');
  }

  setCellsRect(cell: Element, changeX: number, changeY: number) {
    const rows = cell.parentElement.parentElement.children;
    const maxColNum = this.getMaxColNum(cell);
    const averageX = changeX / maxColNum;
    const averageY = changeY / rows.length;
    const preNodes: [Element, string, string][] = [];
    for (const row of rows) {
      const cells = row.children;
      for (const cell of cells) {
        const colspan = ~~cell.getAttribute('colspan') || 1;
        const { width, height } = cell.getBoundingClientRect();
        preNodes.push([cell, `${Math.ceil(width + averageX * colspan)}`, `${Math.ceil(height + averageY)}`]);
      }
    }

    for (const [node, width, height] of preNodes) {
      node.setAttribute('width', width);
      node.setAttribute('height', height);
    }
  }

  getMaxColNum(cell: Element) {
    const cells = cell.parentElement.children;
    let nums = 0;
    for (const cell of cells) {
      const colspan = ~~cell.getAttribute('colspan') || 1;
      nums += colspan;
    }
    return nums;
  }

  updateDragBox(clientX: number, clientY: number) {
    const containerRect = this.quill.container.getBoundingClientRect();
    this.box.classList.add('ql-operate-box-move');
    setElementProperty(this.box, {
      top: `${~~(clientY - containerRect.top - BOX_HEIGHT / 2)}px`,
      left: `${~~(clientX - containerRect.left - BOX_WIDTH / 2)}px`
    });
    this.updateDragTable(clientX, clientY);
  }

  updateDragTable(clientX: number, clientY: number) {
    const { top, left } = this.dragTable.getBoundingClientRect();
    const width = clientX - left;
    const height = clientY - top;
    setElementProperty(this.dragTable, {
      width: `${width}px`,
      height: `${height}px`,
      display: 'block'
    });
  }

  updateCell(node: Element) {
    if (!node) return;
    const isLine = this.isLine(node);
    const handleDrag = (e: MouseEvent) => {
      e.preventDefault();
      if (this.drag) {
        if (isLine) {
          this.updateDragLine(e.clientX, e.clientY);
          this.hideBox();
        } else {
          this.updateDragBox(e.clientX, e.clientY);
          this.hideLine();
        }
      }
    }

    const handleMouseup = (e: MouseEvent) => {
      e.preventDefault();
      const { cellNode, tableNode } = this.options;
      if (isLine) {
        this.setCellRect(cellNode, e.clientX, e.clientY);
        this.toggleLineChildClass(false);
      } else {
        const { right, bottom } = tableNode.getBoundingClientRect();
        const changeX = e.clientX - right;
        const changeY = e.clientY - bottom;
        this.setCellsRect(cellNode, changeX, changeY);
        this.box.classList.remove('ql-operate-box-move');
        this.hideBox();
        this.hideDragTable();
      }
      this.drag = false;
      document.removeEventListener('mousemove', handleDrag, false);
      document.removeEventListener('mouseup', handleMouseup, false);
    }

    const handleMousedown = (e: MouseEvent) => {
      e.preventDefault();
      const { tableNode } = this.options;
      if (isLine) {
        this.toggleLineChildClass(true);
      } else {
        if (this.dragTable) {
          const properties = this.getDragTableProperty(tableNode);
          setElementProperty(this.dragTable, properties);
        } else {
          this.createDragTable(tableNode);
        }
      }
      this.drag = true;
      document.addEventListener('mousemove', handleDrag);
      document.addEventListener('mouseup', handleMouseup);
    }
    node.addEventListener('mousedown', handleMousedown);
  }

  hideLine() {
    this.line && setElementProperty(this.line, { display: 'none' });
  }

  hideBox() {
    this.box && setElementProperty(this.box, { display: 'none' });
  }

  hideDragTable() {
    this.dragTable && setElementProperty(this.dragTable, { display: 'none' });
  }
}

export default OperateLine;