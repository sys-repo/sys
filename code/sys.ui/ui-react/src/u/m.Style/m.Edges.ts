import type { t } from './common.ts';

export const Edges: t.CssEdgesLib = {
  toArray(input: t.CssEdgesInput): t.CssEdgesArray {
    const arr = wrangle.array(input).map((value) => {
      if (value === undefined || value === null) return null;
      if (typeof value === 'number') return value;
      if (typeof value === 'string' && value) return value;
      return null;
    });

    if (arr.length === 1) {
      const [value] = arr;
      return [value, value, value, value];
    } else if (arr.length === 2) {
      const [y, x] = arr;
      return [y, x, y, x];
    } else {
      const [top = null, right = null, bottom = null, left = null] = arr;
      return [top, right, bottom, left];
    }
  },

  toArrayX(input: t.CssEdgesXYInput): t.CssEdgesArray {
    let array = Array.isArray(input) ? input : [input];
    if (array.length === 1) array = [array[0], array[0]];
    const [left, right] = array;
    return [null, right, null, left];
  },

  toArrayY(input: t.CssEdgesXYInput): t.CssEdgesArray {
    let array = Array.isArray(input) ? input : [input];
    if (array.length === 1) array = [array[0], array[0]];
    const [top, bottom] = array;
    return [top, null, bottom, null];
  },
};

/**
 * Helpers
 */
const wrangle = {
  array(input: t.CssEdgesInput) {
    if (input === null || input === undefined) return [null];
    return Array.isArray(input) ? input : [input];
  },
} as const;
