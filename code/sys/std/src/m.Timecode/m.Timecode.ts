import { type t, PATTERN, RE } from './common.ts';
import { format } from './m.Timecode.format.ts';
import { parseMs } from './m.Timecode.parse.ts';
import { sort } from './m.Timecode.sort.ts';
import { toEntries } from './m.Timecode.toEntries.ts';
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
