import type { ObjLib } from './t.ts';

import { Json } from '../m.Json/mod.ts';
import { Path } from '../m.Value.Obj.Path/mod.ts';

import { isEmptyRecord, isObject, isRecord, R } from './common.ts';
import { clone } from './u.clone.ts';
import { extend } from './u.extend.ts';
import { hash } from './u.hash.ts';
import { entries, keys, pick, sortKeys, toArray, trimStringsDeep } from './u.ts';
import { walk } from './u.walk.ts';

export const Obj: ObjLib = {
  Json,
  Path,

  walk,
  toArray,
  trimStringsDeep,
  pick,
  keys,
  entries,
  sortKeys,
  clone,
  extend,
  hash,
  eql: R.equals,

  isObject,
  isRecord,
  isEmptyRecord,
};
