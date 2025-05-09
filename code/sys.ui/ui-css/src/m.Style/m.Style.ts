import { type t, Color } from './common.ts';

import { CssDom as Dom, CssEdges as Edges, CssTmpl as Tmpl, toString } from './common.ts';
import { toShadow } from './u.toShadow.ts';
import { transformer } from './u.transform.ts';
import { isZero } from './u.is.ts';

const { toPadding, toMargins } = Edges;

/** Perform a transformation on a loose set of CSS inputs. */
export const css: t.CssTransform = transformer({});

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

  isZero,
};
