import { type t, PATTERN, RE } from './common.ts';
import { format } from './u.fmt.ts';
import { parseMs } from './u.parse.ts';
import { sort } from './u.sort.ts';
import { toEntries } from './u.toEntries.ts';
import { is, kindOf } from './u.ts';

export const Timecode: t.TimecodeLib = {
  pattern: PATTERN,
  regex: RE,
  is,
  parse: parseMs,
  sort,
  format,
  kindOf,
  toEntries,
};
