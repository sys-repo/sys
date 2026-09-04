import type { t } from './common.ts';

import { Lens } from '../m.Obj.Lens/mod.ts';
import { Path } from '../m.Obj.Path/mod.ts';

import { deep as equals } from '../m.Eql/m.Eql.ts';
import { isEmptyRecord, isObject, isRecord } from './common.ts';
import {
  asGetter,
  clone,
  deepFreeze,
  entries,
  extend,
  hash,
  hasOwn,
  keys,
  pick,
  sortKeys,
  toArray,
  truncateStrings,
  walk,
} from './u/mod.ts';

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
  deepFreeze,
  extend,
  hash,
  eql: equals,
  asGetter,

  isObject,
  isRecord,
  isEmptyRecord,
});
