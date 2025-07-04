import { type t } from './common.ts';

type KeyMap = Record<string, unknown>;

/**
 * Mutates `subject`, setting a nested value at `path`.
 *  - Creates intermediate objects/arrays as needed.
 *  - If `value` is `undefined`, the property is removed via [delete] instead.
 */
export function set<T = unknown>(subject: KeyMap, path: t.ObjectPath, value: T): void {
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
}
