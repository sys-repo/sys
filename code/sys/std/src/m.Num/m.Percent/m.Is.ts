import { Is as ValueIs, type t } from '../common.ts';

/**
 * Predicates over percentage-like values.
 */
export const Is: t.Num.Percent.Is.Lib = {
  /** Determine if the input represents a percentage (0..1). */
  percent(value?: unknown): value is t.Percent {
    return ValueIs.number(value) && value >= 0 && value <= 1;
  },

  /** Determine if the input represents pixels (> 1). */
  pixels(value?: unknown): value is t.Pixels {
    return ValueIs.number(value) && value > 1;
  },
} as const;
