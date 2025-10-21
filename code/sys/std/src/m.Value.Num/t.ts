import type { t } from './common.ts';

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

  /** Determine if the given input is a valid range. */
  isRange(input?: unknown): input is t.MinMaxNumberRange;
};

/**
 * Tools for working with aspect ratios (pure math/formatting).
 * Kept generic so it can serve Media, CSS, image/layout, etc.
 */
export type RatioLib = {
  /** Parse a ratio from string or number. "16/9" → 1.777… */
  parse(value?: string | number): number | undefined;

  /** Convert a decimal ratio → best fraction within a max denominator. */
  toFraction(value?: number, maxDenominator?: number): { num: number; den: number } | undefined;

  /** Format a ratio as "A/B" (or "X.XXX/1" fallback). */
  toString(
    value?: number,
    options?: { maxDenominator?: number; spaces?: boolean; maxError?: number },
  ): string;
};
