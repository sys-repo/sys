import { type t, PATTERN, RE } from './common.ts';
import { Ops } from './m.Ops.ts';
import { format } from './u.core.format.ts';
import { parse } from './u.core.parse.ts';
import { sort } from './u.core.sort.ts';
import { toEntries } from './u.core.toEntries.ts';
import { is, kindOf } from './u.ts';

export const Timecode: t.TimecodeLib = {
  Ops,
  pattern: PATTERN,
  regex: RE,
  is,
  parse,
  sort,
  format,
  kindOf,
  toEntries,
};
