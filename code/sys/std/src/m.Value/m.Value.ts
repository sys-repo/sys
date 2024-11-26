import { type t, isObject, isRecord } from '../common.ts';

import { Array } from '../m.Value.Array/mod.ts';
import { Num } from '../m.Value.Num/mod.ts';
import { Obj } from '../m.Value.Obj/mod.ts';
import { Str } from '../m.Value.Str/mod.ts';
import { toggle } from './u.toggle.ts';

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
  isRecord,
  toggle,
};
