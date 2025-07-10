import { type t } from './common.ts';

type KeyMap = Record<string, unknown>;

/**
 * Deletes the value at the given path if it exists.
 */
export function del(subject: KeyMap, path: t.ObjectPath): t.ObjDiffOp | undefined {
  return;
}
