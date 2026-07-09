import { type t } from '../common.ts';
import { round } from '../u.ts';
import { Is } from './m.Is.ts';
import { Range } from './m.Range.ts';
import { clamp, normalize } from './u.ts';

/**
 * Tools for working with numbers that represent percentages.
 */
export const Percent: t.Num.Percent.Lib = {
  Is,
  Range,
  normalize,
  clamp,

  /**
   * Convert a percentage to a "100%" string
   */
  toString(value?: t.Percent) {
    const percent = normalize(value) * 100;
    return `${round(percent)}%`;
  },
} as const;
