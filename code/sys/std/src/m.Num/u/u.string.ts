import { type t } from '../common.ts';

/**
 * Formats a number for human display with `Intl.NumberFormat` at the host-default locale.
 * Omitted `value` defaults to `0`; omitted `maxDecimals` defaults to `2`.
 * `maxDecimals` maps to `maximumFractionDigits`, including its native coercion and
 * `RangeError` behavior.
 */
export const toString: t.Num.Lib['toString'] = (value = 0, maxDecimals = 2) => {
  const fmt = new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxDecimals,
  });
  return fmt.format(value);
};

/**
 * Convert a zero-based integer.
 */
export const toLetter: t.Num.Lib['toLetter'] = (i) => {
  const n = Math.trunc(i);
  const mod = ((n % 26) + 26) % 26; // positive modulo
  return String.fromCharCode(65 + mod);
};
