import Quill from 'quill';
import {
  QuillTableBetter,
  TableCell,
  TableColgroup
} from '../types';
import {
  setElementProperty,
  setElementAttribute,
  updateTableWidth
} from '../utils';

interface Options {
  tableNode: HTMLElement;
  cellNode: HTMLElement;
  mousePosition: {
    clientX: number;
    clientY: number;
  }
}

const DRAG_BLOCK_HEIGHT = 8;
const DRAG_BLOCK_WIDTH = 8;
const LINE_CONTAINER_HEIGHT = 5;
const LINE_CONTAINER_WIDTH = 5;

class OperateLine {
  quill: Quill;
  options: Options | null;
  drag: boolean;
  line: HTMLElement | null;
  dragBlock: HTMLElement | null;
  dragTable: HTMLElement | null;
  direction: string | null;
  tableBetter: QuillTableBetter;
  constructor(quill: Quill, tableBetter?: QuillTableBetter) {
    this.quill = quill;
    this.options = null;
    this.drag = false;
    this.line = null;
    this.dragBlock = null;
    this.dragTable = null;
    this.direction = null; // 1.level 2.vertical
    this.tableBetter = tableBetter;
    this.quill.root.addEventListener('mousemove', this.handleMouseMove.bind(this));
  }

  createDragBlock() {
    const dragBlock = document.createElement('div');
    dragBlock.classList.add('ql-operate-block');
    const { dragBlockProps } = this.getProperty(this.options);
    setElementProperty(dragBlock, dragBlockProps);
    this.dragBlock = dragBlock;
    this.quill.container.appendChild(dragBlock);
    this.updateCell(dragBlock);
  }

  createDragTable(table: Element) {
    const dragTable = document.createElement('div');
    const properties = this.getDragTableProperty(table);
    dragTable.classList.add('ql-operate-drag-table');
    setElementProperty(dragTable, properties);
    this.dragTable = dragTable;
    this.quill.container.appendChild(dragTable);
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

  getCorrectCol(colgroup: TableColgroup, sum: number) {
    let child = colgroup.children.head;
    while (child && --sum) {
      child = child.next;
    }
    return child;
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

  getLevelColSum(cell: Element) {
    let previousNode = cell;
    let sum = 0;
    while (previousNode) {
      const colspan = ~~previousNode.getAttribute('colspan') || 1;
      sum += colspan;
      // @ts-ignore
      previousNode = previousNode.previousSibling;
    }
    return sum;
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

  getProperty(options: Options) {
    const containerRect = this.quill.container.getBoundingClientRect();
    const { tableNode, cellNode, mousePosition } = options;
    const { clientX, clientY } = mousePosition;
    const tableRect = tableNode.getBoundingClientRect();
    const cellRect = cellNode.getBoundingClientRect();
    const x = cellRect.left + cellRect.width;
    const y = cellRect.top + cellRect.height;
    const dragBlockProps = {
      width: `${DRAG_BLOCK_WIDTH}px`,
      height: `${DRAG_BLOCK_HEIGHT}px`,
      top: `${tableRect.bottom - containerRect.top}px`,
      left: `${tableRect.right - containerRect.left}px`,
      display: tableRect.bottom > containerRect.bottom ? 'none' : 'block'
    }
    if (Math.abs(x - clientX) <= 5) {
      this.direction = 'level';
      return {
        dragBlockProps,
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
        dragBlockProps,
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
    return { dragBlockProps };
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

  handleMouseMove(e: MouseEvent) {
    if (!this.quill.isEnabled()) return;
    const tableNode = (e.target as Element).closest('table');
    const cellNode = (e.target as Element).closest('td,th') as HTMLElement;
    const mousePosition = {
      clientX: e.clientX,
      clientY: e.clientY
    }
    if (!tableNode || !cellNode) {
      if (this.line && !this.drag) {
        this.hideLine();
        this.hideDragBlock();
      }
      return;
    }
    const options = { tableNode, cellNode, mousePosition };
    if (!this.line) {
      this.options = options;
      this.createOperateLine();
      this.createDragBlock();
    } else {
      if (this.drag || !cellNode) return;
      this.updateProperty(options);
    }
  }

  hideDragBlock() {
    this.dragBlock && setElementProperty(this.dragBlock, { display: 'none' });
  }

  hideDragTable() {
    this.dragTable && setElementProperty(this.dragTable, { display: 'none' });
  }

  hideLine() {
    this.line && setElementProperty(this.line, { display: 'none' });
  }

  isLine(node: Element) {
    return node.classList.contains('ql-operate-line-container');
  }

  setCellLevelRect(cell: Element, clientX: number) {
    const { right } = cell.getBoundingClientRect();
    const change = ~~(clientX - right);
    const colSum = this.getLevelColSum(cell);
    const tableBlot = (Quill.find(cell) as TableCell).table();
    const colgroup = tableBlot.colgroup() as TableColgroup;
    const bounds = tableBlot.domNode.getBoundingClientRect();
    if (colgroup) {
      const col = this.getCorrectCol(colgroup, colSum);
      const nextCol = col.next;
      const formats = col.formats()[col.statics.blotName];
      col.domNode.setAttribute('width', `${parseFloat(formats['width']) + change}`);
      if (nextCol) {
        const nextFormats = nextCol.formats()[nextCol.statics.blotName];
        nextCol.domNode.setAttribute('width', `${parseFloat(nextFormats['width']) - change}`);
      }
    } else {
      const isLastCell = cell.nextElementSibling == null;
      const rows = cell.parentElement.parentElement.parentElement.querySelectorAll('tr');
      const preNodes: [Element, string][] = [];
      for (const row of rows) {
        const cells = row.children;
        if (isLastCell) {
          const cell = cells[cells.length - 1];
          const { width } = cell.getBoundingClientRect();
          preNodes.push([cell, `${~~(width + change)}`]);
          continue;
        }
        let sum = 0;
        for (const cell of cells) {
          const colspan = ~~cell.getAttribute('colspan') || 1;
          sum += colspan;
          if (sum > colSum) break;
          if (sum === colSum) {
            const { width } = cell.getBoundingClientRect();
            const nextCell = cell.nextElementSibling;
            if (!nextCell) continue;
            const { width: nextWidth } = nextCell.getBoundingClientRect();
            preNodes.push([cell, `${~~(width + change)}`], [nextCell, `${~~(nextWidth - change)}`]);
          }
        }
      }
      for (const [node, width] of preNodes) {
        setElementAttribute(node, { width });
        setElementProperty(node as HTMLElement, { width: `${width}px` });
      }
    }
    if (cell.nextElementSibling == null) {
      updateTableWidth(tableBlot.domNode, bounds, change);
    }
  }

  setCellRect(cell: Element, clientX: number, clientY: number) {
    if (this.direction === 'level') {
      this.setCellLevelRect(cell, clientX);
    } else if (this.direction === 'vertical') {
      this.setCellVerticalRect(cell, clientY);
    }
  }

  setCellsRect(cell: Element, changeX: number, changeY: number) {
    const rows = cell.parentElement.parentElement.children;
    const maxColNum = this.getMaxColNum(cell);
    const averageX = changeX / maxColNum;
    const averageY = changeY / rows.length;
    const preNodes: [Element, string, string][] = [];
    const tableBlot = (Quill.find(cell) as TableCell).table();
    const colgroup = tableBlot.colgroup() as TableColgroup;
    const bounds = tableBlot.domNode.getBoundingClientRect();
    for (const row of rows) {
      const cells = row.children;
      for (const cell of cells) {
        const colspan = ~~cell.getAttribute('colspan') || 1;
        const { width, height } = cell.getBoundingClientRect();
        preNodes.push([cell, `${Math.ceil(width + averageX * colspan)}`, `${Math.ceil(height + averageY)}`]);
      }
    }
    if (colgroup) {
      let col = colgroup.children.head;
      for (const [node, , height] of preNodes) {
        setElementAttribute(node, { height });
        setElementProperty(node as HTMLElement, { height: `${height}px` });
      }
      while (col) {
        const { width } = col.domNode.getBoundingClientRect();
        setElementAttribute(col.domNode, { width: `${Math.ceil(width + averageX)}` });
        col = col.next;
      }
    } else {
      for (const [node, width, height] of preNodes) {
        setElementAttribute(node, { width, height });
        setElementProperty(node as HTMLElement, {
          width: `${width}px`,
          height: `${height}px`
        });
      }
    }
    updateTableWidth(tableBlot.domNode, bounds, changeX);
  }

  setCellVerticalRect(cell: Element, clientY: number) {
    const rowspan = ~~cell.getAttribute('rowspan') || 1;
    const cells = rowspan > 1 ? this.getVerticalCells(cell, rowspan) : cell.parentElement.children;
    for (const cell of cells) {
      const { top } = cell.getBoundingClientRect();
      const height = `${~~(clientY - top)}`;
      setElementAttribute(cell, { height });
      setElementProperty(cell as HTMLElement, { height: `${height}px` });
    }
  }

  toggleLineChildClass(isAdd: boolean) {
    const node = this.line.firstElementChild;
    if (isAdd) {
      node.classList.add('ql-operate-line');
    } else {
      node.classList.remove('ql-operate-line');
    }
  }

  updateCell(node: Element) {
    if (!node) return;
    const isLine = this.isLine(node);
    const handleDrag = (e: MouseEvent) => {
      e.preventDefault();
      if (this.drag) {
        if (isLine) {
          this.updateDragLine(e.clientX, e.clientY);
          this.hideDragBlock();
        } else {
          this.updateDragBlock(e.clientX, e.clientY);
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
        this.dragBlock.classList.remove('ql-operate-block-move');
        this.hideDragBlock();
        this.hideDragTable();
      }
      this.drag = false;
      document.removeEventListener('mousemove', handleDrag, false);
      document.removeEventListener('mouseup', handleMouseup, false);
      this.tableBetter.tableMenus.updateMenus(tableNode);
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

  updateDragBlock(clientX: number, clientY: number) {
    const containerRect = this.quill.container.getBoundingClientRect();
    this.dragBlock.classList.add('ql-operate-block-move');
    setElementProperty(this.dragBlock, {
      top: `${~~(clientY - containerRect.top - DRAG_BLOCK_HEIGHT / 2)}px`,
      left: `${~~(clientX - containerRect.left - DRAG_BLOCK_WIDTH / 2)}px`
    });
    this.updateDragTable(clientX, clientY);
  }

  updateDragLine(clientX: number, clientY: number) {
    const containerRect = this.quill.container.getBoundingClientRect();
    if (this.direction === 'level') {
      setElementProperty(this.line, { left: `${~~(clientX - containerRect.left - LINE_CONTAINER_WIDTH / 2)}px` });
    } else if (this.direction === 'vertical') {
      setElementProperty(this.line, { top: `${(~~clientY - containerRect.top - LINE_CONTAINER_HEIGHT / 2)}px` });
    }
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

  updateProperty(options: Options) {
    const { containerProps, lineProps, dragBlockProps } = this.getProperty(options);
    if (!containerProps || !lineProps) return;
    this.options = options;
    setElementProperty(this.line, containerProps);
    setElementProperty(this.line.firstChild as HTMLElement, lineProps);
    setElementProperty(this.dragBlock, dragBlockProps);
  }
}

export default OperateLine;