import { Is, type t } from './common.ts';

export const toArray: t.CssEdges.Lib['toArray'] = (input, defaultValue) => {
  const DEF = wrangle.defaultValue(defaultValue);
  const arr = wrangle.asArray(input, defaultValue).map((value) => {
    if (value === undefined) return DEF;
    if (value === null) return null;
    if (Is.num(value)) return value;
    if (Is.str(value) && value) return value;
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

export const toArrayX: t.CssEdges.Lib['toArrayX'] = (input, defaultValue) => {
  let array = Array.isArray(input) ? input : [input];
  if (array.length === 1) array = [array[0], array[0]];
  const [left, right] = array;
  return toArray([null, right, null, left], defaultValue);
};

export const toArrayY: t.CssEdges.Lib['toArrayY'] = (input, defaultValue) => {
  let array = Array.isArray(input) ? input : [input];
  if (array.length === 1) array = [array[0], array[0]];
  const [top, bottom] = array;
  return toArray([top, null, bottom, null], defaultValue);
};

/**
 * Helpers
 */
const wrangle = {
  defaultValue(value?: t.CssEdges.Default) {
    if (value === undefined || value === null) return null;
    if (Is.num(value) || Is.str(value)) return value;
    return null;
  },

  asArray(input: t.CssEdges.Input, defaultValue?: t.CssEdges.Default) {
    if (input === null || input === undefined) return [wrangle.defaultValue(defaultValue)];
    return Array.isArray(input) ? input : [input];
  },

  asNumber(value: any) {
    if (Is.blank(value)) return value;

    value = Is.str(value) ? value.trim() : value;
    const num = parseFloat(value);
    if (num === undefined) return value;
    if (num.toString().length !== value.toString().length) return value;

    return Number.isNaN(num) ? value : num;
  },
} as const;
