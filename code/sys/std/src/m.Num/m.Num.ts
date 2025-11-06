import type { t } from './common.ts';
import { Percent } from './m.Percent.ts';
import { Ratio } from './m.Ratio.ts';

/**
 * Tools for working with numbers.
 */
export const Num: t.NumberLib = {
  Percent,
  Ratio,

  /**
   * Rounds a number to the specified number of decimal places.
   */
  round(value, precision) {
    const multiplier = Math.pow(10, precision || 0);
    return Math.round(value * multiplier) / multiplier;
  },

  /**
   * Clamps a number between a minimum and maximum value.
   */
  clamp(min, max, value) {
    return Math.max(min, Math.min(max, value));
  },

  /**
   * Formats a number into a display string.
   */
  toString(value = 0, maxDecimals = 2) {
    const fmt = new Intl.NumberFormat(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: maxDecimals,
    });
    return fmt.format(value);
  },

  /**
   * Convert a zero-based integer.
   */
  toLetter(i) {
    const n = Math.trunc(i);
    const mod = ((n % 26) + 26) % 26; // positive modulo
    return String.fromCharCode(65 + mod);
  },
};
