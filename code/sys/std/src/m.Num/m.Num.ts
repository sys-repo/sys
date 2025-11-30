import type { t } from './common.ts';
import { Percent } from './m.Percent.ts';
import { Ratio } from './m.Ratio.ts';
import { toLetter, toString } from './u.string.ts';
import { clamp, round } from './u.ts';

/**
 * Tools for working with numbers.
 */
export const Num: t.NumberLib = {
  Percent,
  Ratio,

  round,
  clamp,

  toString,
  toLetter,
};
