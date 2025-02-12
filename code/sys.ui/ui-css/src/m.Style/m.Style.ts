import { type t, Color } from './common.ts';

import { Edges } from '../m.Style.Edges/mod.ts';
import { css } from './u.css.ts';
import { toShadow } from './u.ts';

const { toPadding, toMargins } = Edges;

export const Style: t.StyleLib = {
  Color,
  Edges,
  css,
  toPadding,
  toMargins,
  toShadow,
};
