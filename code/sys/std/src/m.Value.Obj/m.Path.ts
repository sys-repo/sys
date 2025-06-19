import { type t } from './common.ts';

export const Path: t.ObjPathLib = {
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

  /**
   * Tools that mutate an object in-place using
   * an abstract path arrays.
   */
  Mutate: {
    /**
     * Ensures the entire path exists and assigns `value`
     * at the leaf. Mutates the original `subject`.
     */
    set(subject, path, value) {
      if (path.length === 0) throw new Error('The path-array must contain at least one segment');

      let node: any = subject;
      for (let i = 0; i < path.length - 1; i++) {
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

      node[path[path.length - 1]] = value;
    },
  },
};
