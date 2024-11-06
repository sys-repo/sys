import type { t } from '../common.ts';
import { build, pluck, prune, remove } from './m.Obj.path.ts';
import { pick, toArray, trimStringsDeep, walk } from './m.Obj.ts';

export const Obj: t.ObjLib = {
  walk,
  toArray,
  trimStringsDeep,
  pick,
  build,
  pluck,
  remove,
  prune,
};
