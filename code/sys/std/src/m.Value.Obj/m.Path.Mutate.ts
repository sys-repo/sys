import type { t } from './common.ts';
import { diff } from './m.Path.Mutate.diff.ts';
import { set } from './m.Path.Mutate.set.ts';
import { get } from './m.Path.get.ts';

type KeyMap = Record<string, unknown>;

/**
 * Tools that mutate an object in-place using
 * an abstract path arrays.
 */
export const Mutate: t.ObjPathMutateLib = {
  diff,
  set,

  /**
   * Ensure a value at the given path exists (not undefined),
   * and if not assigns the given default.
   */
  ensure<T = unknown>(subject: KeyMap, path: t.ObjectPath, value: t.NonUndefined<T>) {
    const existing = get(subject, path);
    if (existing === undefined) set(subject, path, value);
    return get<T>(subject, path, value);
  },
};
