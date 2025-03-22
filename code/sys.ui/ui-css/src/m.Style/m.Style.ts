import { type t, Color } from './common.ts';

import { DEFAULT, CssDom as Dom, CssEdges as Edges, CssTmpl as Tmpl, toString } from './common.ts';
import { toShadow } from './u.toShadow.ts';
import { transformer } from './u.transform.ts';

const { toPadding, toMargins } = Edges;
const prefix = DEFAULT.classPrefix;

/** Perform a transformation on a loose set of CSS inputs. */
export const css: t.CssTransform = transformer({ classPrefix: prefix });

/**
 * CSS styling tools.
 */
export const Style: t.StyleLib = {
  Dom,
  Color,
  Edges,
  Tmpl,

  css,
  transformer,

  toPadding,
  toMargins,
  toShadow,
  toString,
};
