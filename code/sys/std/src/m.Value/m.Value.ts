import type { t } from '../common.ts';

import { Array } from '../m.Value.Array/mod.ts';
import { Num } from '../m.Value.Num/mod.ts';
import { Obj } from '../m.Value.Obj/mod.ts';
import { Str } from '../m.Value.Str/mod.ts';
import { isObject } from './u.isObject.ts';

export { Array, Num, Obj, Str };

/**
 * Tools for evaluating and manipulating types of values.
 */
export const Value: t.ValueLib = {
  Array,
  Num,
  Str,
  Obj,
  round: Num['round'],
  isObject,
};
