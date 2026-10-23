import { type t } from '../common.ts';
import { Is as NumIs } from '../m.Is.ts';
import { normalize } from './u.ts';

export const Range: t.Num.Percent.Range.Lib = Object.freeze({
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
    if (!Array.isArray(input) || input.length !== 2) return false;
    const [min, max] = input;
    return NumIs.finite(min) && NumIs.finite(max) && min <= max;
  },
});
