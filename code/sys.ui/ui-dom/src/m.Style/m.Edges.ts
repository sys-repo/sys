import type { t } from './common.ts';
import { toArray, toArrayX, toArrayY } from './m.Edges.toArray.ts';
import { toEdges, toMargins, toPadding } from './m.Edges.toEdges.ts';

export const Edges: t.CssEdgesLib = {
  toArray,
  toArrayX,
  toArrayY,

  toEdges,
  toMargins,
  toPadding,
};
