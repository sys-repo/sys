import { type t, PATTERN, RE } from './common.ts';
import { format } from './u.core.format.ts';
import { parseMs } from './u.core.parse.ts';
import { sort } from './u.core.sort.ts';
import { toEntries } from './u.core.toEntries.ts';
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
