import type { ObjLib } from './t.ts';

import { Lens } from '../m.Obj.Lens/mod.ts';
import { Path } from '../m.Obj.Path/mod.ts';

import { isEmptyRecord, isObject, isRecord, R } from './common.ts';
import { clone } from './u.clone.ts';
import { extend } from './u.extend.ts';
import { hash } from './u.hash.ts';
import { trimStringsDeep } from './u.trim.ts';
import { entries, keys, pick, sortKeys, toArray } from './u.ts';
import { walk } from './u.walk.ts';

export const Obj: ObjLib = {
  Path,
  Lens,

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
