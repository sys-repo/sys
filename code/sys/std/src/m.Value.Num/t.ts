import type { t } from '../common.ts';

/**
 * Tools for working with numbers.
 */
export type NumLib = {
  readonly Percent: t.PercentLib;

  /**
   * Rounds a number to the specified number of decimal places.
   */
  round(value: number, precision?: number): number;
};

/**
 * Tools for working with numbers that represent percentages.
 */
export type PercentLib = {
  /**
   * Convert a value to a percentage.
   */
  clamp(value?: string | number, min?: string | number, max?: string | number): t.Percent;

  /**
   * Determine if the number represents a percentage (0..1).
   */
  isPercent(value?: t.PixelOrPercent): value is number;

  /**
   * Determine if the number represents pixels (> 1).
   */
  isPixels(value?: t.PixelOrPercent): value is number;

  /**
   * Convert a percentage to a "100%" string
   */
  toString(value?: t.Percent): string;
};
