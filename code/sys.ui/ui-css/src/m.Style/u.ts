import { type t, Color, isObject } from './common.ts';

/**
 * Converts into to a box-shadow.
 */
export const toShadow: t.CssToShadow = (input) => {
  if (input === undefined) return undefined;
  const { blur } = input;
  const x = input.x ? `${input.x}px` : '0';
  const y = input.y ? `${input.y}px` : '0';
  const col = Color.format(input.color);
  const inset = input.inner ? 'inset ' : '';
  return `${inset}${x} ${y} ${blur}px 0 ${col}`;
};

export function isTransformed(input: any): input is t.CssTransformed {
  if (!isObject(input)) return false;
  const o = input as t.CssTransformed;
  return typeof o.hx === 'number' && typeof o.style === 'object';
}
