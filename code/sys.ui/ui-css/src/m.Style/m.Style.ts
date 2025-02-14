import { type t, Color } from './common.ts';

import { DEFAULT, CssDom as Dom, CssEdges as Edges, CssTmpl as Tmpl } from './common.ts';
import { toShadow } from './u.toShadow.ts';
import { toString } from './u.toString.ts';
import { transformer } from './u.transform.ts';

const { toPadding, toMargins } = Edges;
const prefix = DEFAULT.prefix;

/** Perform a transformation on a loose set of CSS inputs. */
export const css: t.CssTransform = transformer({ prefix });

/**
 * CSS styling tools.
 */
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
