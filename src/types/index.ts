import TableHeader from '../formats/header';
import TableList, { ListContainer } from '../formats/list';
import {
  TableBody,
  TableCell,
  TableCellBlock,
  TableCol,
  TableColgroup,
  TableContainer,
  TableRow,
  TableTemporary
} from '../formats/table';
import TableClipboard from '../modules/clipboard';
import TableToolbar from '../modules/toolbar';
import QuillTableBetter from '../quill-table-better';
import CellSelection from '../ui/cell-selection';
import OperateLine from '../ui/operate-line';
import TableMenus from '../ui/table-menus';
import ToolbarTable, { TableSelect } from '../ui/toolbar-table';

export interface CorrectBound {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width?: number;
  height?: number;
}

export interface Props {
  [propName: string]: string;
}

export type InsertTableHandler = (rows: number, columns: number) => void;

export type TableCellAllowedChildren = TableCellBlock | TableHeader | ListContainer;

export type TableCellChildren = TableCellAllowedChildren | TableList;

export type TableCellMap = Map<string, HTMLElement[]>;

export type UseLanguageHandler = (name: string) => string;

export type {
  CellSelection,
  ListContainer,
  OperateLine,
  QuillTableBetter,
  TableBody,
  TableCell,
  TableCellBlock,
  TableClipboard,
  TableCol,
  TableColgroup,
  TableContainer,
  TableHeader,
  TableList,
  TableMenus,
  TableRow,
  TableSelect,
  TableTemporary,
  TableToolbar,
  ToolbarTable
};

export default QuillTableBetter;
