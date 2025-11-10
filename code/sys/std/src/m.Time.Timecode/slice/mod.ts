import type { t } from '../common.ts';

import { is } from './u.is.ts';
import { parse } from './u.parse.ts';
import { resolve } from './u.resolve.ts';

/**
 * Implementation of time-slice strings:
 * "<from>..<to>"
 *
 * - Bounds may be:
 *   • absolute VTT timecode        →  "HH:MM:SS(.mmm)"
 *   • empty (open)                 →  ""      (resolved to 0 or total)
 *   • negative VTT (from the end)  →  "-HH:MM:SS(.mmm)"
 *
 * Resolution yields a concrete [from, to) millisecond window.
 */
export const Slice: t.TimecodeSliceLib = {
  is,
  parse,
  resolve,
};
