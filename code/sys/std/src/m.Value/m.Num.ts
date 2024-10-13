import type { t } from './common.ts';

/**
 * Library: Tools for working with numbers as values.
 */
export const Num: t.NumLib = {
  /**
   * Rounds a number to the given number of decimal places.
   */
  round(value, precision) {
    const multiplier = Math.pow(10, precision || 0);
    return Math.round(value * multiplier) / multiplier;
  },
};
