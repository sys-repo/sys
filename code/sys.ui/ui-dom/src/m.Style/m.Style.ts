import { Color, type t } from './common.ts';
import { Edges } from './m.Edges.ts';

const { toPadding, toMargins } = Edges;

export const Style: t.StyleLib = {
  Color,
  Edges,
  toPadding,
  toMargins,
};
