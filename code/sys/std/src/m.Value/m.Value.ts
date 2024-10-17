import type { t } from '../common.ts';

import { Array } from '../m.Value.Array/mod.ts';
import { Num } from '../m.Value.Num/mod.ts';
import { isObject } from './u.isObject.ts';

/**
 * Tools for evaluating and manipulating types of values.
 */
export const Value: t.ValueLib = {
  Array,
  Num,
  round: Num['round'],
  isObject,
};
