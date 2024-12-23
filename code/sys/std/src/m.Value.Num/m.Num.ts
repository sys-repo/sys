import type { t } from '../common.ts';

/**
 * Tools for working with numbers.
 */
export const Num: t.NumLib = {
  /**
   * Rounds a number to the specified number of decimal places.
   */
  round(value, precision) {
    const multiplier = Math.pow(10, precision || 0);
    return Math.round(value * multiplier) / multiplier;
  },
};
