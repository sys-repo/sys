import type { t } from './common.ts';

import { ArrayLib } from '../m.Value.Array/mod.ts';
import { Num } from './m.Num.ts';
import { Str } from './m.Str.ts';

/**
 * Determine if the given input is typeof "object" and not <null>.
 */
export function isObject(input: any): input is object {
  return typeof input === 'object' && input !== null;
}

/**
 * Tools for evaluating and manipulating types of values.
 */
export const Value: t.ValueLib = {
  /* Library: Tools for working with array. */
  Array: ArrayLib,

  /* Library: Tools for working with numbers as values. */
  Num,

  /* Library: Tools for working with strings. */
  Str,

  /* Rounds a number to the given number of decimal places. */
  round: Num['round'],

  /* Determine if the given input is typeof "object" and not <null>. */
  isObject,
};
