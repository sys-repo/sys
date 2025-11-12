import type { t } from './common.ts';

import { VClock, VTime } from './clock/mod.ts';
import { Composite } from './composite/mod.ts';
import { Ops } from './core.ops/mod.ts';
import { format, is, kindOf, parse, sort, toEntries } from './core/mod.ts';
import { Pattern } from './m.Pattern.ts';
import { Slice } from './slice/mod.ts';

export const Timecode: t.TimecodeLib = {
  Ops,
  Pattern,

  Slice,
  Composite,
  VTime,
  VClock,

  is,
  parse,
  sort,
  format,
  kindOf,
  toEntries,
};
