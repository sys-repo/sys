import type { t } from './common.ts';

export type * from './t.percent.ts';
export type * from './t.ratio.ts';

/**
 * Tools for working with numbers.
 */
export type NumberLib = {
  /** Tools for working with percentages. */
  readonly Percent: t.PercentLib;
  /** Tools for working with ratios. */
  readonly Ratio: t.RatioLib;

  /**
   * Maximum integer representable exactly in the Num domain.
   * Alias of Number.MAX_SAFE_INTEGER (IEEE-754 safe integer limit).
   */
  readonly MAX_INT: number;

  /**
   * Minimum integer representable exactly in the Num domain.
   * Equivalent to -Number.MAX_SAFE_INTEGER.
   */
  readonly MIN_INT: number;

  /**
   * Positive infinity.
   * Alias of Number.POSITIVE_INFINITY.
   */
  readonly INFINITY: number;

  /** Rounds a number to the specified number of decimal places. */
  round(value: number, precision?: number): number;

  /** Clamps a number between a minimum and maximum value. */
  clamp(min: number, max: number, value: number): number;

  /** Sum a list of numbers (empty list → 0). */
  sum(values: t.Ary<number>): number;

  /**
   * Convert a zero-based integer
   * (0 → A, 1 → B, ... 25 → Z, 26 → A again) into an ASCII uppercase letter.
   */
  toLetter: (index: number) => string;

  /** Formats a number into a display string. */
  toString(value?: number, maxDecimals?: number): string;
};
