import { Is, isObject, type t } from './common.ts';
import { toEdges, WrangleEdge } from './u.toEdges.ts';

export const Tmpl: t.StyleTmplLib = {
  toEdges,

  /**
   * Apply common CSS templates (desiganted by capital letter field names)
   * converting the object into standard [CssProperties].
   *
   * For example: { Absolute: 0 }
   */
  transform(input?: t.CssValue): t.CSSObject {
    if (Is.falsy(input) || !isObject(input)) return {};

    // Absolute → { position: 'absolute' ... }
    if (input.Absolute !== undefined) input = WrangleEdge.absolute(input);

    // Margin → { marginLeft: ... }
    if (input.Margin !== undefined) input = WrangleEdge.margin(input);
    if (input.MarginX !== undefined) input = WrangleEdge.marginX(input);
    if (input.MarginY !== undefined) input = WrangleEdge.marginY(input);

    // Padding → { paddingLeft: ... }
    if (input.Padding !== undefined) input = WrangleEdge.padding(input);
    if (input.PaddingX !== undefined) input = WrangleEdge.paddingX(input);
    if (input.PaddingY !== undefined) input = WrangleEdge.paddingY(input);

    /* Finish up: no change */
    return input as t.CSSObject;
  },
} as const;
