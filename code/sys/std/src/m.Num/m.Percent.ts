import { Is, type t } from './common.ts';
import { PercentRange as Range } from './m.Percent.Range.ts';
import { clamp as clampPercent, normalize as normalizePercent } from './u.percent.ts';

/**
 * Tools for working with numbers that represent percentages.
 */
export const Percent: t.Num.Percent.Lib = {
  Is: {
    /** Determine if the input represents a percentage (0..1). */
    percent(value?: unknown): value is t.Percent {
      return Is.number(value) && value >= 0 && value <= 1;
    },

    /** Determine if the input represents pixels (> 1). */
    pixels(value?: unknown): value is t.Pixels {
      return Is.number(value) && value > 1;
    },
  },

  Range,

  /**
   * Normalize a number or string to a bounded 0..1 percentage.
   * Numbers are fractional (`0.35` → 35%); strings may be fractional or percent-form (`"35%"`).
   * Invalid input normalizes to `0`; out-of-range values clamp to the nearest bound.
   */
  normalize(value?: string | number): t.Percent {
    return normalizePercent(value);
  },

  /** Normalize a value, then constrain it by optional min/max percent bounds. */
  clamp(value?: string | number, min?: string | number, max?: string | number): t.Percent {
    return clampPercent(value, min, max);
  },

  /**
   * Convert a percentage to a "100%" string
   */
  toString(value?: t.Percent) {
    const percent = Percent.normalize(value);
    return `${Math.round(percent * 100)}%`;
  },
} as const;
