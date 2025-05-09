import type { t } from '../common.ts';

import { clone } from './m.Obj.clone.ts';
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
};
