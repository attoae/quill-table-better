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

declare type _useLanguage = (name: string) => string