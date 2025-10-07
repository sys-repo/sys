/**
 * Edge value formatting tools.
 * @module
 */
import type { CssEdgesLib } from './t.ts';

import { toArray, toArrayX, toArrayY } from './u.toArray.ts';
import { toEdges, toMargins, toPadding } from './u.toEdges.ts';

export const CssEdges: CssEdgesLib = {
  toArray,
  toArrayX,
  toArrayY,

  toEdges,
  toMargins,
  toPadding,
};
