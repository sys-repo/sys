import type { ColorInput } from 'tinycolor2';
import type { t } from '../common.ts';

import tinycolor from 'tinycolor2';
import { DARK, RED } from './u.const.ts';

export * from './u.const.ts';
export * from './u.theme.ts';

/**
 * Creates a new tiny-color instance.
 * https://github.com/bgrins/TinyColor
 */
export const create = (value: ColorInput) => tinycolor(value);
export const black = () => create('black');
export const white = () => create('white');
export const dark = () => create(DARK);

/**
 * Mixes two colors.
 * https://github.com/bgrins/TinyColor#color-utilities
 */
export function mix(color1: ColorInput, color2: ColorInput, amount?: number) {
  return tinycolor.mix(color1, color2, amount);
}

/**
 * Takes a value of various types and converts it into a color.
 */
export function format(value: string | number | boolean | undefined): string | undefined {
  if (value === undefined) return undefined;
  if (value === true) return RED;
  if (typeof value === 'number') return toGrayAlpha(value);
  if (typeof value === 'string') {
    if (value.includes('url(')) return value;
    if (!value.includes('#') && !value.includes('rgb')) return `#${value}`;
  }
  return value as string;
}

/**
 * A number between -1 (black) and 1 (white).
 */
export function toGrayAlpha(value: number): string {
  if (value < -1) value = -1;
  if (value > 1) value = 1;

  if (value < 0) return `rgba(0, 0, 0, ${Math.abs(value)})`; // Black.
  if (value > 0) return `rgba(255, 255, 255, ${value})`; // White.

  return `rgba(0, 0, 0, 0.0)`; // Transparent.
}

/**
 * A number between -1 (black) and 1 (white).
 */
export function toGrayHex(value: number): string {
  if (value < -1) value = -1;
  if (value > 1) value = 1;

  // Black.
  if (value < 0) {
    return white()
      .darken(Math.abs(value) * 100)
      .toHexString();
  }

  // White.
  if (value > 0) {
    return black()
      .lighten(value * 100)
      .toHexString();
  }

  return white().toHexString();
}

/**
 * Converts a color to an alpha RGB value.
 */
export function alpha(color: string, alpha: number) {
  return create(color).setAlpha(alpha).toRgbString();
}

/**
 * Lightens the given color.
 * @param amount: 0..100
 */
export function lighten(color: string, amount: number) {
  return create(color).lighten(amount).toRgbString();
}

/**
 * Darkens the given color.
 * @param amount: 0..100
 */
export function darken(color: string, amount: number) {
  return create(color).darken(amount).toRgbString();
}

/**
 * A curried function that returns a "red/ruby" color shade based on the given debug flag.
 */
export function debug(debug?: boolean) {
  return (opacity: t.Percent) => (debug ? `rgba(255, 0, 0, ${opacity})` : undefined);
}
