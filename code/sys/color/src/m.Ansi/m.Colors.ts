import { Color as rgb } from '../m.Rgb/mod.ts';
import type { t } from './common.ts';

/** Standard ANSI colors. */
import * as c from './u.stdlib.ts';
export { c };

/**
 * CLI color formatting tools.
 */
export const Color: t.AnsiColorLib = {
  ansi: c,
  rgb,
};
