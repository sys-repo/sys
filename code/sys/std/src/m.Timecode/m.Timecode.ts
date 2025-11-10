import { type t, PATTERN, RE } from './common.ts';
import { format } from './core/u.format.ts';
import { parse } from './core/u.parse.ts';
import { sort } from './core/u.sort.ts';
import { toEntries } from './core/u.toEntries.ts';
import { Ops } from './m.Ops.ts';
import { Slice } from './m.Slice.ts';
import { is, kindOf } from './u.ts';

export const Timecode: t.TimecodeLib = {
  Ops,
  Slice,
  pattern: PATTERN,
  regex: RE,
  is,
  parse,
  sort,
  format,
  kindOf,
  toEntries,
};
