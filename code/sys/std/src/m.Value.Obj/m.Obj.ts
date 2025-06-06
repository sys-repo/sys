import type { ObjLib } from './t.ts';

import { isEmptyRecord, isObject, isRecord } from '../common.ts';
import { clone } from './u.clone.ts';
import { extend } from './u.extend.ts';
import { hash } from './u.hash.ts';
import { build, pluck, prune, remove } from './u.path.ts';
import { keys, pick, sortKeys, toArray, trimStringsDeep } from './u.ts';
import { walk } from './u.walk.ts';
import { Json } from '../m.Json/mod.ts';

export const Obj: ObjLib = {
  Json,
  walk,
  toArray,
  trimStringsDeep,
  pick,
  build,
  pluck,
  remove,
  prune,
  keys,
  sortKeys,
  clone,
  extend,
  hash,

  isObject,
  isRecord,
  isEmptyRecord,
};
