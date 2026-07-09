import { type t, Is } from './common.ts';
import { normalize as normalizePercent } from './u.percent.ts';

export const PercentRange: t.Num.Percent.Range.Lib = {
  toPercent(value, range) {
    if (!PercentRange.isRange(range)) return 0;
    const [min, max] = range;
    return min === max ? 0 : normalizePercent((value - min) / (max - min));
  },

  fromPercent(percent, range) {
    if (!PercentRange.isRange(range)) return 0;
    const [min, max] = range;
    const p = normalizePercent(percent);
    return min + (max - min) * p;
  },

  isRange(input): input is t.MinMaxNumberRange {
    if (!Array.isArray(input)) return false;
    return Is.number(input[0]) && Is.number(input[1]);
  },
} as const;
