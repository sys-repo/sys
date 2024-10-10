import type { t } from '../common.ts';

/**
 * Tools for evaluating and manipulating types of values.
 */
export type ValueLib = {
  /**
   * Tools for working with array.
   */
  Array: t.ArrayLib;

  /**
   * Rounds a number to the given number of decimal places.
   */
  round(value: number, precision?: number): number;
};
