import { type t, Is, isObject } from './common.ts';

export function isTransformed(input: any): input is t.CssTransformed {
  if (!isObject(input)) return false;
  const o = input as t.CssTransformed;
  return Is.num(o.hx) && Is.object(o.style);
}

export const isZero: t.StyleLib['isZero'] = (value) => {
  if (value === 0) return true;
  if (Is.str(value)) {
    value = value.trim();
    return /^0(?:\.0+)?(?:[a-z%]+)?$/i.test(value);
  }
  return false;
};
