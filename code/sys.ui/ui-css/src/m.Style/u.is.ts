import { type t, Color, isObject } from './common.ts';

export function isTransformed(input: any): input is t.CssTransformed {
  if (!isObject(input)) return false;
  const o = input as t.CssTransformed;
  return typeof o.hx === 'number' && typeof o.style === 'object';
}
