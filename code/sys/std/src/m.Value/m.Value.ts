import { type t, isEmptyRecord, isObject, isRecord } from '../common.ts';

import { Arr } from '../m.Value.Arr/mod.ts';
import { Num } from '../m.Value.Num/mod.ts';
import { Obj } from '../m.Value.Obj/mod.ts';
import { Lorem, Str } from '../m.Value.Str/mod.ts';
import { toggle } from './u.toggle.ts';

export { Arr, isEmptyRecord, Lorem, Num, Obj, Str };

/**
 * Tools for evaluating and manipulating types of values.
 */
export const Value: t.ValueLib = {
  Arr,
  Num,
  Str,
  Obj,
  round: Num['round'],
  isObject,
  isRecord,
  isEmptyRecord,
  toggle,
};
