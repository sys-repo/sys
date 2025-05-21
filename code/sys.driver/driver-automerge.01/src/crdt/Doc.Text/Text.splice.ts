import { A, ObjectPath, type t } from './common.ts';

type O = Record<string, unknown>;

/**
 * Safely modify a string stored on a CRDT.
 */

export const splice: t.TextSplice = <T extends O>(
  doc: T,
  path: t.ObjectPath,
  index: t.Index,
  delCount: number,
  newText?: string,
) => {
  A.splice(doc, [...path], index, delCount, newText);
};

/**
 * Replace part of a string using splice.
 */
export function replace<T extends O>(doc: T, path: t.ObjectPath, next: string) {
  const current = ObjectPath.resolve(doc, path);
  if (typeof current === 'string') splice(doc, path, 0, current.length, next);
}
