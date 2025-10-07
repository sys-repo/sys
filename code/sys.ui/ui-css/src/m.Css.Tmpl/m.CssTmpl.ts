import type { CssTmplLib } from './t.ts';

import { type t, Is, isObject } from './common.ts';
import { formatScroll } from './u.formatScroll.ts';
import { formatSize } from './u.formatSize.ts';
import { formatGap } from './u.gap.ts';
import { toEdges, WrangleEdge } from './u.toEdges.ts';

/**
 * Helpers for working with the template patterns (a DSL for css of sorts).
 */
export const CssTmpl: CssTmplLib = {
  toEdges,

  /**
   * Apply common CSS templates (desiganted by capital letter field names)
   * converting the object into standard [CssProperties].
   *
   * For example: { Absolute: 0 }
   */
  transform(input?: t.CssValue): t.CssProps {
    if (Is.falsy(input) || !isObject(input)) return {};
    let o = input;

    // Absolute → { position: 'absolute' ... }
    if (o.Absolute !== undefined) o = WrangleEdge.absolute(o);

    // Margin → { marginLeft: ... }
    if (o.Margin !== undefined) o = WrangleEdge.margin(o);
    if (o.MarginX !== undefined) o = WrangleEdge.marginX(o);
    if (o.MarginY !== undefined) o = WrangleEdge.marginY(o);

    // Padding → { paddingLeft: ... }
    if (o.Padding !== undefined) o = WrangleEdge.padding(o);
    if (o.PaddingX !== undefined) o = WrangleEdge.paddingX(o);
    if (o.PaddingY !== undefined) o = WrangleEdge.paddingY(o);

    // Size → { width, height }
    if (o.Size !== undefined) formatSize('Size', o.Size, o);

    // Scroll → { overflow... }
    if (typeof o.Scroll === 'boolean') formatScroll('Scroll', o.Scroll, o);

    // Grid: gap.
    if (o.gap !== undefined) o = formatGap(o);
    if (o.columnGap !== undefined) o = formatGap(o);
    if (o.rowGap !== undefined) o = formatGap(o);

    /** Finish up: no change */
    return o as t.CssProps;
  },
};
