import type { t } from '../common.ts';

/**
 * Tools for evaluating and manipulating types of values.
 */
export type ValueLib = {
  /**
   * Tools for working with arrays.
   */
  Array: t.ArrayLib;

  /**
   * Library: Tools for working with numbers.
   */
  Num: t.NumLib;

  /**
   * Rounds a number to the specified number of decimal places.
   */
  round: t.NumLib['round'];

  /**
   * Determine if the given input is typeof {object} and not Null.
   */
  isObject(input: unknown): input is object;
};
