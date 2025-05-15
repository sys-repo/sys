import { type t } from '../common.ts';

export const PercentRange: t.PercentRangeLib = {
  /**
   * Convert a real value (eg brightness) → slider percent.
   * Returns 0..1, clamped if the input is outside the range.
   */
  toPercent(value, range) {
    const [min, max] = range;
    return min === max ? 0 : clamp((value - min) / (max - min));
  },

  /**
   * Convert a slider percent (0 … 1) → real value within the range.
   * Percent is clamped, output is always within [min, max].
   */
  fromPercent(percent, range) {
    const [min, max] = range;
    const p = clamp(percent);
    return min + (max - min) * p;
  },
} as const;

/**
 * Helpers:
 */

/** Clamp a number to an interval. */
const clamp = (n: number, low = 0, high = 1) => Math.min(Math.max(n, low), high);
