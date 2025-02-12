import { type t, Color } from './common.ts';

import { Edges } from '../m.Edges/mod.ts';
import { css, transform } from './u.transform.ts';
import { toShadow } from './u.ts';

const { toPadding, toMargins } = Edges;

export const Style: t.StyleLib = {
  Color,
  Edges,

  transform,
  css,

  toPadding,
  toMargins,
  toShadow,
};
