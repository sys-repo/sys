import { type t } from './common.ts';

/**
 * Formats a number into a display string.
 */
export const toString: t.NumberLib['toString'] = (value = 0, maxDecimals = 2) => {
  const fmt = new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxDecimals,
  });
  return fmt.format(value);
};

/**
 * Convert a zero-based integer.
 */
export const toLetter: t.NumberLib['toLetter'] = (i) => {
  const n = Math.trunc(i);
  const mod = ((n % 26) + 26) % 26; // positive modulo
  return String.fromCharCode(65 + mod);
};
