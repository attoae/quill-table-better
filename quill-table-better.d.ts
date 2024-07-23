declare module 'quill';
declare module '*.svg';

declare interface CorrectBound {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width?: number;
  height?: number;
}

declare interface Props {
  [propName: string]: string
}

declare type _Map = Map<string, HTMLTableCellElement[]>;

declare type _useLanguage = (name: string) => string

declare type _insertTable = (rows: number, columns: number) => void;