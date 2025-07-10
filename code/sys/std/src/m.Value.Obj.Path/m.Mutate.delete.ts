import { type t } from './common.ts';

type KeyMap = Record<string, unknown>;

/**
 * Deletes the value at the given path if it exists.
 */
export function del(subject: KeyMap, path: t.ObjectPath): t.ObjDiffOp | undefined {
  if (path == null || path.length === 0) return;

  // Descend to the parent of the target.
  let node: any = subject;
  for (let i = 0; i < path.length - 1; i += 1) {
    const key = path[i];
    if (node == null || typeof node !== 'object' || !(key in node)) {
      return undefined; // Nothing to delete.
    }
    node = node[key];
  }

  // Capture the previous value and bail if absent.
  const lastKey = path[path.length - 1];
  if (node == null || typeof node !== 'object' || !(lastKey in node)) {
    return undefined;
  }
  const prev = node[lastKey];

  // perform the deletion
  delete node[lastKey];

  // emit the remove-op
  return { type: 'remove', path, prev };
}
