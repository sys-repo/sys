import { type t } from '../common.ts';
import { PercentRange as Range } from './m.Percent.Range.ts';

/**
 * Tools for working with numbers that represent percentages.
 */
export const Percent: t.PercentLib = {
  Range,

  /**
   * Convert a value to a percentage.
   */
  clamp(value?: string | number, min?: string | number, max?: string | number): t.Percent {
    const clamp = (value: number) => Math.max(0, Math.min(1, value));
    const done = (value: number) => {
      value = clamp(value);
      if (typeof min === 'number') value = Math.max(min, value);
      if (typeof max === 'number') value = Math.min(max, value);
      return value;
    };

    if (typeof value === 'number') return done(value);
    if (typeof value === 'string') {
      const text = value.trim();
      if (!text) return 0;
      if (text.endsWith('%')) {
        const num = Number(text.replace(/%$/, ''));
        return done(isNaN(num) ? 0 : num / 100);
      } else {
        const num = Number(text);
        return done(isNaN(num) ? 0 : num);
      }
    }
    return done(0);
  },

  /**
   * Determine if the number represents a percentage (0..1).
   */
  isPercent(value?: t.PixelOrPercent): value is number {
    if (typeof value !== 'number') return false;
    return value >= 0 && value <= 1;
  },

  /**
   * Determine if the number represents pixels (> 1).
   */
  isPixels(value?: t.PixelOrPercent): value is number {
    if (typeof value !== 'number') return false;
    return value > 1;
  },

  /**
   * Convert a percentage to a "100%" string
   */
  toString(value?: t.Percent) {
    const percent = Percent.clamp(value);
    return `${Math.round(percent * 100)}%`;
  },
} as const;
