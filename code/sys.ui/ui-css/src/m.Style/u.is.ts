import { type t, isObject } from './common.ts';

export function isTransformed(input: any): input is t.CssTransformed {
  if (!isObject(input)) return false;
  const o = input as t.CssTransformed;
  return typeof o.hx === 'number' && typeof o.style === 'object';
}

export const isZero: t.StyleLib['isZero'] = (value) => {
  if (value === 0) return true;
  if (typeof value === 'string' && value.startsWith('0')) return true;
  return false;
};
