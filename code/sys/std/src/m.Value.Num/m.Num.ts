import { Percent } from './m.Percent.ts';
import type { NumberLib } from './t.ts';

/**
 * Tools for working with numbers.
 */
export const Num: NumberLib = {
  Percent,

  /**
   * Rounds a number to the specified number of decimal places.
   */
  round(value, precision) {
    const multiplier = Math.pow(10, precision || 0);
    return Math.round(value * multiplier) / multiplier;
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
};
