import { Is, type t } from './common.ts';

export const toArray: t.CssEdgesLib['toArray'] = (input, defaultValue) => {
  const DEF = wrangle.defaultValue(defaultValue);
  const arr = wrangle.asArray(input, defaultValue).map((value) => {
    if (value === undefined) return DEF;
    if (value === null) return null;
    if (typeof value === 'number') return value;
    if (typeof value === 'string' && value) return value;
    return DEF;
  });

  if (arr.length === 1) {
    const [value] = arr;
    return [value, value, value, value];
  } else if (arr.length === 2) {
    const [y, x] = arr;
    return [y, x, y, x];
  } else {
    const [top = DEF, right = DEF, bottom = DEF, left = DEF] = arr;
    return [top, right, bottom, left];
  }
};

export const toArrayX: t.CssEdgesLib['toArrayX'] = (input, defaultValue) => {
  let array = Array.isArray(input) ? input : [input];
  if (array.length === 1) array = [array[0], array[0]];
  const [left, right] = array;
  return toArray([null, right, null, left], defaultValue);
};

export const toArrayY: t.CssEdgesLib['toArrayY'] = (input, defaultValue) => {
  let array = Array.isArray(input) ? input : [input];
  if (array.length === 1) array = [array[0], array[0]];
  const [top, bottom] = array;
  return toArray([top, null, bottom, null], defaultValue);
};

/**
 * Helpers
 */
const wrangle = {
  defaultValue(value?: t.CssEdgeDefault) {
    if (value === undefined || value === null) return null;
    if (typeof value === 'number' || typeof value === 'string') return value;
    return null;
  },

  asArray(input: t.CssEdgesInput, defaultValue?: t.CssEdgeDefault) {
    if (input === null || input === undefined) return [wrangle.defaultValue(defaultValue)];
    return Array.isArray(input) ? input : [input];
  },

  asNumber(value: any) {
    if (Is.blank(value)) return value;

    value = typeof value === 'string' ? value.trim() : value;
    const num = parseFloat(value);
    if (num === undefined) return value;
    if (num.toString().length !== value.toString().length) return value;

    return Number.isNaN(num) ? value : num;
  },
} as const;
