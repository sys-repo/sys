import { Color, type t } from './common.ts';
import { toShadow } from './m.Edges.to.ts';
import { Edges } from './m.Edges.ts';

const { toPadding, toMargins } = Edges;

export const Style: t.StyleLib = {
  Color,
  Edges,
  toPadding,
  toMargins,
  toShadow,
};
