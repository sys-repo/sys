import type { t } from './common.ts';
import { Percent } from './m.Percent.ts';
import { Ratio } from './m.Ratio.ts';
import { toLetter, toString } from './u.string.ts';
import { clamp, round, sum } from './u.ts';

/**
 * Tools for working with numbers.
 */
export const Num: t.NumberLib = {
  MAX_INT: Number.MAX_SAFE_INTEGER,
  MIN_INT: Number.MIN_SAFE_INTEGER,
  INFINITY: Number.POSITIVE_INFINITY,

  Percent,
  Ratio,

  sum,
  round,
  clamp,

  toString,
  toLetter,
};
