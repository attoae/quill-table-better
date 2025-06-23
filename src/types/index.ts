import QuillTableBetter from '../quill-table-better';
import {
  TableCellBlock,
  TableThBlock,
  TableCell,
  TableTh,
  TableRow,
  TableThRow,
  TableBody,
  TableThead,
  TableTemporary,
  TableContainer,
  TableCol,
  TableColgroup
} from '../formats/table';
import TableHeader from '../formats/header';
import TableList, { ListContainer } from '../formats/list';
import CellSelection from '../ui/cell-selection';
import OperateLine from '../ui/operate-line';
import TableMenus from '../ui/table-menus';
import ToolbarTable, { TableSelect } from '../ui/toolbar-table';
import TableToolbar from '../modules/toolbar';
import TableClipboard from '../modules/clipboard';

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

export type UseLanguageHandler = (name: string) => string

export type {
  QuillTableBetter,
  TableCellBlock,
  TableThBlock,
  TableCell,
  TableTh,
  TableRow,
  TableThRow,
  TableBody,
  TableThead,
  TableTemporary,
  TableContainer,
  TableCol,
  TableColgroup,
  TableHeader,
  TableList,
  ListContainer,
  CellSelection,
  OperateLine,
  TableMenus,
  ToolbarTable,
  TableSelect,
  TableToolbar,
  TableClipboard
};

export default QuillTableBetter;