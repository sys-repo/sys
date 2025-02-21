/**
 * @module
 * Edge value formatting tools.
 */
import type { t } from './common.ts';
import { toArray, toArrayX, toArrayY } from './u.toArray.ts';
import { toEdges, toMargins, toPadding } from './u.toEdges.ts';

export const CssEdges: t.CssEdgesLib = {
  toArray,
  toArrayX,
  toArrayY,

  toEdges,
  toMargins,
  toPadding,
};
