import type { t } from './common.ts';
import { del } from './m.Mutate.delete.ts';
import { diff } from './m.Mutate.diff.ts';
import { ensure } from './m.Mutate.ensure.ts';
import { set } from './m.Mutate.set.ts';

/**
 * Tools that mutate an object in-place using
 * an abstract path arrays.
 */
export const Mutate: t.Obj.Path.Mutate.Lib = Object.freeze({
  diff,
  set,
  ensure,
  delete: del,
});
