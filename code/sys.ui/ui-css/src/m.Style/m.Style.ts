import { type t, Color } from './common.ts';

import { CssDom as Dom, CssEdges as Edges, CssTmpl as Tmpl } from './common.ts';
import { toShadow } from './u.toShadow.ts';
import { toString } from './u.toString.ts';
import { transform } from './u.transform.ts';

const { toPadding, toMargins } = Edges;

export const Style: t.StyleLib = {
  Color,
  Edges,
  Dom,
  Tmpl,

  transform,

  toPadding,
  toMargins,
  toShadow,
  toString,
};
