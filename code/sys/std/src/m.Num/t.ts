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

  /** Rounds a number to the specified number of decimal places. */
  round(value: number, precision?: number): number;

  /** Formats a number into a display string. */
  toString(value?: number, maxDecimals?: number): string;

  /** Clamps a number between a minimum and maximum value. */
  clamp(min: number, max: number, value: number): number;

  /**
   * Convert a zero-based integer
   * (0 → A, 1 → B, ... 25 → Z, 26 → A again) into an ASCII uppercase letter.
   */
  toLetter: (index: number) => string;
};
