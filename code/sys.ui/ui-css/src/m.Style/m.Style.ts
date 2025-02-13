import { type t, Color } from './common.ts';

import { Edges } from '../m.Edges/mod.ts';
import { CssDom as Dom } from './m.CssDom.ts';
import { toString } from './u.toString.ts';
import { css, transform } from './u.transform.ts';
import { toShadow } from './u.ts';

const { toPadding, toMargins } = Edges;

export const Style: t.StyleLib = {
  Color,
  Edges,
  Dom,

  transform,
  css,

  toPadding,
  toMargins,
  toShadow,
  toString,
};
