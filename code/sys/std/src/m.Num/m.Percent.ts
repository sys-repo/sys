import { Is, type t } from './common.ts';
import { PercentRange as Range } from './m.Percent.Range.ts';

/**
 * Tools for working with numbers that represent percentages.
 */
export const Percent: t.Num.Percent.Lib = {
  Range,

  /**
   * Normalize a number or string to a bounded 0..1 percentage.
   * Numbers are fractional (`0.35` → 35%); strings may be fractional or percent-form (`"35%"`).
   * Invalid input normalizes to `0`; out-of-range values clamp to the nearest bound.
   */
  clamp(value?: string | number, min?: string | number, max?: string | number): t.Percent {
    let percent = wrangle.percent(value);
    if (Is.number(min)) percent = Math.max(wrangle.percent(min), percent);
    if (Is.number(max)) percent = Math.min(wrangle.percent(max), percent);
    return wrangle.unit(percent);
  },

  /**
   * Determine if the number represents a percentage (0..1).
   */
  isPercent(value?: t.PixelOrPercent): value is number {
    return Is.number(value) && value >= 0 && value <= 1;
  },

  /**
   * Determine if the number represents pixels (> 1).
   */
  isPixels(value?: t.PixelOrPercent): value is number {
    return Is.number(value) && value > 1;
  },

  /**
   * Convert a percentage to a "100%" string
   */
  toString(value?: t.Percent) {
    const percent = Percent.clamp(value);
    return `${Math.round(percent * 100)}%`;
  },
} as const;

/**
 * Helpers:
 */
const wrangle = {
  percent(input?: string | number): t.Percent {
    if (Is.number(input)) return wrangle.unit(input);
    if (Is.string(input)) {
      const text = input.trim();
      if (!text) return 0;
      const scalar = text.endsWith('%') ? Number(text.replace(/%$/, '')) / 100 : Number(text);
      return wrangle.unit(scalar);
    }
    return 0;
  },

  unit(value: number): t.Percent {
    if (!Is.number(value)) return 0;
    return Math.max(0, Math.min(1, value));
  },
} as const;
