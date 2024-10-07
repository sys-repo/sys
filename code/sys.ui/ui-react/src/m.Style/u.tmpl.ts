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
    if (!isObject(input)) return {};

    /**
     * Absolute → { position: 'absolute' ... }
     */
    if (input.Absolute !== undefined) {
      const props = Tmpl.toEdges(input.Absolute);
      const res: t.CSSObject = { ...input, position: 'absolute', ...props };
      delete res.Absolute;
      return res;
    }

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
  toEdges(input) {
    const done = (top?: N, right?: N, bottom?: N, left?: N) => {
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
} as const;
