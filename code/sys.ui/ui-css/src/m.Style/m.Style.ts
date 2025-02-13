import { type t, Color } from './common.ts';

import { CssEdges as Edges } from '../m.Css.Edges/mod.ts';
import { CssTmpl as Tmpl } from '../m.Css.Tmpl/mod.ts';

import { CssDom as Dom } from './m.CssDom.ts';
import { toString } from './u.toString.ts';
import { css, transform } from './u.transform.ts';
import { toShadow } from './u.ts';

const { toPadding, toMargins } = Edges;

export const Style: t.StyleLib = {
  Color,
  Edges,
  Dom,
  Tmpl,

  transform,
  css,

  toPadding,
  toMargins,
  toShadow,
  toString,
};
