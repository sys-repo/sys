import { type t, isEmptyRecord, isObject, isRecord } from '../common.ts';
import { clone } from './m.Obj.clone.ts';
import { extend } from './m.Obj.extend.ts';
import { hash } from './m.Obj.hash.ts';
import { build, pluck, prune, remove } from './m.Obj.path.ts';
import { pick, sortKeys, toArray, trimStringsDeep, walk } from './m.Obj.ts';

export { sortKeys };

export const Obj: t.ObjLib = {
  walk,
  toArray,
  trimStringsDeep,
  pick,
  build,
  pluck,
  remove,
  prune,
  sortKeys,
  clone,
  extend,
  hash,

  isObject,
  isRecord,
  isEmptyRecord,
};
