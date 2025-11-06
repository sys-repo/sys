import { isEmptyRecord, isObject, isRecord } from '../common.ts';
import type { ValueLib } from './t.ts';

import { Arr } from '../m.Arr/mod.ts';
import { Num } from '../m.Num/mod.ts';
import { Obj } from '../m.Obj/mod.ts';
import { Lorem, Str } from '../m.Str/mod.ts';
import { toggle } from './u.toggle.ts';

export { Arr, isEmptyRecord, Lorem, Num, Obj, Str };

/**
 * Tools for evaluating and manipulating types of values.
 */
export const Value: ValueLib = {
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
