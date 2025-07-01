import { type t } from './common.ts';

type KeyMap = Record<string, unknown>;

/**
 * Tools that mutate an object in-place using
 * an abstract path arrays.
 */
const Mutate: t.ObjPathMutateLib = {
  /**
   * Ensure a value at the given path exists (not undefined),
   * and if not assigns the given default.
   */
  ensure<T = unknown>(subject: KeyMap, path: t.ObjectPath, value: t.NonUndefined<T>) {
    const existing = Path.get(subject, path);
    if (existing === undefined) Path.Mutate.set(subject, path, value);
    return Path.get<T>(subject, path, value);
  },

  /**
   * Mutates `subject`, setting a nested value at `path`.
   *  - Creates intermediate objects/arrays as needed.
   *  - If `value` is `undefined`, the property is removed via [delete] instead.
   */
  set(subject, path, value) {
    if (path.length === 0) throw new Error('The path-array must contain at least one segment');

    let node: any = subject;
    for (let i = 0; i < path.length - 1; i += 1) {
      const key = path[i];
      const nextKey = path[i + 1];
      const shouldBeArray = typeof nextKey === 'number';

      if (
        node[key] === undefined ||
        (shouldBeArray && !Array.isArray(node[key])) ||
        (!shouldBeArray && typeof node[key] !== 'object')
      ) {
        node[key] = shouldBeArray ? [] : {};
      }

      node = node[key];
    }

    const lastKey = path[path.length - 1];
    if (value === undefined) {
      delete node[lastKey]; // ← NB: removed instead of setting <undefined>.
    } else {
      node[lastKey] = value;
    }
  },
};

export const Path: t.ObjPathLib = {
  Mutate,
  mutate: Mutate.set,

  /**
   * Walks a deep path and returns the value found,
   * or `undefined` / `defaultValue` if missing.
   */
  get(subject, path, defaultValue?) {
    let node: any = subject;

    for (const key of path) {
      if (node == null) return defaultValue as any;
      node = node[key as keyof typeof node];
    }

    return (node === undefined ? defaultValue : node) as any;
  },
};
