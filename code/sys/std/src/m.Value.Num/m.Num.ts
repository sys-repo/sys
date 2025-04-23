import toHash from 'hash-it';
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

  /**
   * Convert the value to a simple number-hash.
   */
  hash<T>(value: T) {
    return toHash<T>(value);
  },
};
