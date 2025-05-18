import type { t } from './common.ts';

/**
 * Tools for working with numbers.
 */
export type NumLib = {
  readonly Percent: t.PercentLib;

  /** Rounds a number to the specified number of decimal places. */
  round(value: number, precision?: number): number;

  /** Formats a number into a display string. */
  toString(value?: number, maxDecimals?: number): string;
};

/**
 * Tools for working with numbers that represent percentages.
 */
export type PercentLib = {
  readonly Range: t.PercentRangeLib;

  /** Convert a value to a percentage. */
  clamp(value?: string | number, min?: string | number, max?: string | number): t.Percent;

  /** Determine if the number represents a percentage (0..1). */
  isPercent(value?: t.PixelOrPercent): value is number;

  /** Determine if the number represents pixels (> 1). */
  isPixels(value?: t.PixelOrPercent): value is number;

  /** Convert a percentage to a "100%" string */
  toString(value?: t.Percent): string;
};

/**
 * Tools for working with percentage ranges (eg, min/max).
 */
export type PercentRangeLib = {
  /**
   * Convert a real value (eg brightness) → slider percent.
   * Returns 0 ..1, clamped if the input is outside the range.
   */
  toPercent(value: number, range: t.MinMaxNumberRange): number;

  /**
   * Convert a slider percent (0 … 1) → real value within the range.
   * Percent is clamped, output is always within [min, max].
   */
  fromPercent(percent: number, range: t.MinMaxNumberRange): number;

  /**
   * Determine if the given input is a valid range.
   */
  isRange(input?: unknown): input is t.MinMaxNumberRange;
};
