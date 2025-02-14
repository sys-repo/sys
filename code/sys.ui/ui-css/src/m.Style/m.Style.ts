import { type t, Color } from './common.ts';

import { CssDom as Dom, CssEdges as Edges, CssTmpl as Tmpl, DEFAULT } from './common.ts';
import { toShadow } from './u.toShadow.ts';
import { toString } from './u.toString.ts';
import { transformer } from './u.transform.ts';

const { toPadding, toMargins } = Edges;
const prefix = DEFAULT.prefix;
export const css = transformer({ prefix });

export const Style: t.StyleLib = {
  Color,
  Edges,
  Dom,
  Tmpl,

  css,
  transformer,

  toPadding,
  toMargins,
  toShadow,
  toString,
};
