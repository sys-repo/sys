import { type t, isEmptyRecord, isObject, isRecord } from '../common.ts';
import { clone } from './u.clone.ts';
import { extend } from './u.extend.ts';
import { hash } from './u.hash.ts';
import { build, pluck, prune, remove } from './u.path.ts';
import { keys, pick, sortKeys, toArray, trimStringsDeep } from './u.ts';
import { walk } from './u.walk.ts';

export const Obj: t.ObjLib = {
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
