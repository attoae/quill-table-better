import Quill from 'quill';
import type { Range } from 'quill';
import type { TableCellChildren } from './';

interface BindingObject
  extends Partial<Omit<Context, 'prefix' | 'suffix' | 'format'>> {
  key: number | string | string[];
  shortKey?: boolean | null;
  shiftKey?: boolean | null;
  altKey?: boolean | null;
  metaKey?: boolean | null;
  ctrlKey?: boolean | null;
  prefix?: RegExp;
  suffix?: RegExp;
  format?: Record<string, unknown> | string[];
  handler?: (
    this: { quill: Quill },
    range: Range,
    // eslint-disable-next-line no-use-before-define
    curContext: Context,
    // eslint-disable-next-line no-use-before-define
    binding: NormalizedBinding,
  ) => boolean | void;
}

interface Context {
  collapsed: boolean;
  empty: boolean;
  offset: number;
  prefix: string;
  suffix: string;
  format: Record<string, unknown>;
  event: KeyboardEvent;
  line: TableCellChildren;
}

interface NormalizedBinding extends Omit<BindingObject, 'key' | 'shortKey'> {
  key: string | number;
}

export { Context, BindingObject }