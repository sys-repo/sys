/**
 * @module
 */
import { type t, Is, isObject } from './common.ts';
import { formatSize } from './u.formatSize.ts';
import { toEdges, WrangleEdge } from './u.toEdges.ts';

export const CssTmpl: t.CssTmplLib = {
  toEdges,

  /**
   * Apply common CSS templates (desiganted by capital letter field names)
   * converting the object into standard [CssProperties].
   *
   * For example: { Absolute: 0 }
   */
  transform(input?: t.CssValue): t.CssProps {
    if (Is.falsy(input) || !isObject(input)) return {};
    let o = input as t.CssTemplates;

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

    /** Finish up: no change */
    return o as t.CssProps;
  },
};
