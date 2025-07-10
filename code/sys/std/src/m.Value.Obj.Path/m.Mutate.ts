import type { t } from './common.ts';

import { del } from './m.Mutate.delete.ts';
import { diff } from './m.Mutate.diff.ts';
import { set } from './m.Mutate.set.ts';
import { get } from './m.Path.get.ts';

type O = Record<string, unknown>;

/**
 * Tools that mutate an object in-place using
 * an abstract path arrays.
 */
export const Mutate: t.ObjPathMutateLib = {
  diff,
  set,
  delete: del,

  /**
   * Ensure a value at the given path exists (not undefined),
   * and if not assigns the given default.
   */
  ensure<T = unknown>(subject: O, path: t.ObjectPath, value: t.NonUndefined<T>) {
    const existing = get(subject, path);
    if (existing === undefined) set(subject, path, value);
    return get<T>(subject, path, value);
  },
};
