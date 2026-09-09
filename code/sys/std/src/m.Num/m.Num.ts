import type { t } from './common.ts';
import { Is } from './m.Is.ts';
import { Percent } from './m.Percent/mod.ts';
import { Ratio } from './m.Ratio.ts';
import { clamp, round, sum } from './u/mod.ts';
import { random } from './u/u.random.ts';
import { toLetter, toString } from './u/u.string.ts';

/**
 * Number tools with ECMAScript-aligned predicates and explicit numeric domains.
 */
export const Num: t.Num.Lib = Object.freeze({
  Is,
  MAX_INT: Number.MAX_SAFE_INTEGER,
  MIN_INT: Number.MIN_SAFE_INTEGER,
  INFINITY: Number.POSITIVE_INFINITY,

  Percent,
  Ratio,

  sum,
  round,
  clamp,
  random,

  toString,
  toLetter,
});
