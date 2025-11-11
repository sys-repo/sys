import { type t } from './common.ts';
import { Composite } from './composite/mod.ts';
import { format, is, kindOf, parse, sort, toEntries } from './core/mod.ts';
import { Pattern } from './m.Pattern.ts';
import { Ops } from './ops/mod.ts';
import { Slice } from './slice/mod.ts';

export const Timecode: t.TimecodeLib = {
  Pattern,

  Ops,
  Slice,
  Composite,

  is,
  parse,
  sort,
  format,
  kindOf,
  toEntries,
};
