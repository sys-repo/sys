import type { t } from '../common.ts';
import { ArrayLib } from '../m.Value.Array/mod.ts';

/**
 * Tools for evaluating and manipulating types of values.
 */
export const Value: t.ValueLib = {
  /**
   * Tools for working with array.
   */
  Array: ArrayLib,

  /**
   * Rounds a number to the given number of decimal places.
   */
  round(value, precision) {
    const multiplier = Math.pow(10, precision || 0);
    return Math.round(value * multiplier) / multiplier;
  },
};
