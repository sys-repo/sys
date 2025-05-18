import { type t, Is } from './common.ts';

export const PercentRange: t.PercentRangeLib = {
  toPercent(value, range) {
    if (!PercentRange.isRange(range)) return 0;
    const [min, max] = range;
    return min === max ? 0 : clamp((value - min) / (max - min));
  },

  fromPercent(percent, range) {
    if (!PercentRange.isRange(range)) return 0;
    const [min, max] = range;
    const p = clamp(percent);
    return min + (max - min) * p;
  },

  isRange(input): input is t.MinMaxNumberRange {
    if (!Array.isArray(input)) return false;
    return Is.number(input[0]) && Is.number(input[1]);
  },
} as const;

/**
 * Helpers:
 */
function clamp(n: number, low = 0, high = 1) {
  return Math.min(Math.max(n, low), high);
}
