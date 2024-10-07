import { Is, isObject, type t } from './common.ts';

type N = number | string | null;

export const Tmpl: t.StyleTmplLib = {
  /**
   * Apply common CSS templates (desiganted by capital letter field names)
   * converting the object into standard [CssProperties].
   *
   * For example: { Absolute: 0 }
   */
  transform(input?: t.CssValue): t.CSSObject {
    if (Is.falsy(input) || !isObject(input)) return {};

    // Absolute → { position: 'absolute' ... }
    if (input.Absolute !== undefined) return wrangle.absolute(input);

    /* Finish up: no change */
    return input as t.CSSObject;
  },

  /**
   * Convert a sloppy input into an {edges} property object
   * Input:
   *  - single value (eg. 0 or '5em')
   *  - 4-part array (eg. [10, null, 0, 5])
   *  - Y/X array    (eg. [20, 5])
   */
  toEdges(input, override) {
    const done = (top?: N, right?: N, bottom?: N, left?: N) => {
      if (typeof override === 'function') {
        top = override('top', top);
        right = override('right', right);
        bottom = override('bottom', bottom);
        left = override('left', left);
      }
      return { top, right, bottom, left } as Partial<t.CssEdges>;
    };
    const fromArray = (input: t.CssEdgesArray) => {
      const [top, right, bottom, left] = wrangle.edgesArray(input as N[]);
      return done(top, right, bottom, left);
    };

    if (input == null) return {};
    if (typeof input === 'string' && input.includes(' ')) {
      const parts = input.split(' ').map((v) => (Is.numeric(v) ? Number(v) : v));
      return fromArray(parts as t.CssEdgesArray);
    }
    if (isEdgeValue(input)) {
      return done(input, input, input, input);
    }
    if (Array.isArray(input)) {
      return fromArray(wrangle.edgesArray(input as N[]));
    }
    return {};
  },
} as const;

/**
 * Helpers
 */
function isEdgeValue(input: any): input is N {
  return typeof input === 'number' || typeof input === 'string';
}

/**
 * Converts input to CSS margin edges.
 */
// export const toMargins: t.CssToEdges<t.CssMarginEdges> = (input, options = {}) => {
//   return prefixEdges<t.CssMarginEdges>('margin', toEdges(input, options));
// };

/**
 * Converts input to CSS padding edges.
 */
// export const toPadding: t.CssToEdges<t.CssPaddingEdges> = (input, options = {}) => {
//   return prefixEdges<t.CssPaddingEdges>('padding', toEdges(input, options));
// };

/**
 * Helpers
 */
const wrangle = {
  edgesArray(input: N[]): t.CssEdgesArray {
    if (input.length === 1) {
      const [value] = input;
      return [value, value, value, value];
    } else if (input.length === 2) {
      const [y, x] = input;
      return [y, x, y, x];
    } else {
      const [top = null, right = null, bottom = null, left = null] = input;
      return [top, right, bottom, left];
    }
  },

  absolute(obj: t.CssValue): t.CSSObject {
    if (obj.Absolute === undefined) return obj;
    const props = Tmpl.toEdges(obj.Absolute, (edge, value) => {
      if (typeof value !== 'number') return value;
      return Math.max(0, value);
    });
    const res: t.CSSObject = { ...obj, position: 'absolute', ...props };
    delete res.Absolute;
    return res;
  },
} as const;
