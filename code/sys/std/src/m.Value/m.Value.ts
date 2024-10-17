import type { t } from '../common.ts';

import { Array } from '../m.Value.Array/mod.ts';
import { Num } from '../m.Value.Num/mod.ts';
import { Str } from '../m.Value.Str/mod.ts';
import { isObject } from './u.isObject.ts';

export { Array, Num, Str };

/**
 * Tools for evaluating and manipulating types of values.
 */
export const Value: t.ValueLib = {
  Array,
  Num,
  Str,
  round: Num['round'],
  isObject,
};
