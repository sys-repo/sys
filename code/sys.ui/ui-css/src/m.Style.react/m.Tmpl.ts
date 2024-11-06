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

    // Size → { width, height }
    if (input.Size !== undefined) formatSize('Size', input.Size, input);

    /** Finish up: no change */
    return input as t.CSSObject;
  },
} as const;

/**
 * Helpers
 */
export function formatSize(key: string, input: unknown, target: t.CSSObject) {
  type V = string | number | undefined;
  const format = (input: any): V => {
    if (!(typeof input === 'number' || typeof input === 'string')) return;
    if (typeof input === 'string' && !input.trim()) return;
    return input;
  };
  if (Array.isArray(input)) {
    const width = format(input[0]);
    const height = format(input[1]);
    if (width !== undefined && height !== undefined) {
      const styles = { width, height };
      mergeAndReplace(key, styles, target);
    }
  } else {
    const value = format(input);
    if (value !== undefined) {
      const styles = { width: value, height: value };
      mergeAndReplace(key, styles, target);
    }
  }
}

function mergeAndReplace(key: string, value: unknown, target: t.CSSObject) {
  Object.assign(target, value);
  delete target[key as keyof t.CSSObject];
  return target;
}
