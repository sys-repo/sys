import { c, type t } from './common.ts';

import { Color as rgb } from '../m.Rgb/mod.ts';
import { escape } from './u.escape.ts';
import { foreground } from './u.foreground.ts';

/** CLI color formatting tools. */
export const Color: t.AnsiColor.Lib = Object.freeze({
  ansi: c,
  foreground,
  escape,
  rgb,
});
