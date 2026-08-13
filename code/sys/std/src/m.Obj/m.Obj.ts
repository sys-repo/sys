import type { t } from './common.ts';

import { Lens } from '../m.Obj.Lens/mod.ts';
import { Path } from '../m.Obj.Path/mod.ts';

import { deep as equals } from '../m.Eql/m.Eql.ts';
import { isEmptyRecord, isObject, isRecord } from './common.ts';
import { asGetter } from './u.asGetter.ts';
import { clone } from './u.clone.ts';
import { extend } from './u.extend.ts';
import { entries } from './u.entries.ts';
import { hash } from './u.hash.ts';
import { hasOwn } from './u.hasOwn.ts';
import { truncateStrings } from './u.truncate.ts';
import { keys, pick, sortKeys, toArray } from './u.ts';
import { walk } from './u.walk.ts';

export const Obj: t.Obj.Lib = Object.freeze({
  Path,
  Lens,

  walk,
  toArray,
  truncateStrings,
  pick,
  keys,
  hasOwn,
  entries,
  sortKeys,
  clone,
  extend,
  hash,
  eql: equals,
  asGetter,

  isObject,
  isRecord,
  isEmptyRecord,
});
