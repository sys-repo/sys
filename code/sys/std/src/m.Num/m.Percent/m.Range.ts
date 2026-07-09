import { type t, Is } from '../common.ts';
import { normalize } from './u.ts';

export const Range: t.Num.Percent.Range.Lib = {
  toPercent(value, range) {
    if (!Range.isRange(range)) return 0;
    const [min, max] = range;
    return min === max ? 0 : normalize((value - min) / (max - min));
  },

  fromPercent(percent, range) {
    if (!Range.isRange(range)) return 0;
    const [min, max] = range;
    const p = normalize(percent);
    return min + (max - min) * p;
  },

  isRange(input): input is t.MinMaxNumberRange {
    if (!Array.isArray(input)) return false;
    return Is.number(input[0]) && Is.number(input[1]);
  },
} as const;
