import type { ObjLib } from './t.ts';

import { isEmptyRecord, isObject, isRecord } from '../common.ts';
import { Json } from '../m.Json/mod.ts';
import { clone } from './u.clone.ts';
import { extend } from './u.extend.ts';
import { hash } from './u.hash.ts';
import { build, pluck, prune, remove } from './u.path.ts';
import { entries, keys, pick, sortKeys, toArray, trimStringsDeep } from './u.ts';
import { walk } from './u.walk.ts';

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
  entries,
  sortKeys,
  clone,
  extend,
  hash,

  isObject,
  isRecord,
  isEmptyRecord,
};
