import type { t } from './common.ts';

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
