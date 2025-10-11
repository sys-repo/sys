import type * as Y from 'yaml';
import { isMap, isSeq, isScalar } from 'yaml';
import { type t } from './common.ts';

export function deepGet(node: Y.Node | null | undefined, path: t.ObjectPath): unknown {
  let current: unknown = node;

  for (const segment of path) {
    if (current == null) return undefined;

    if (isMap(current) && typeof segment === 'string') {
      // YAMLMap of Pair<Scalar, Node>:
      const pair = current.items.find((item) => isScalar(item.key) && item.key.value === segment);
      current = pair?.value ?? undefined;
    } else if (isSeq(current) && typeof segment === 'number') {
      // YAMLSeq: array of Nodes
      current = current.items[segment];
    } else {
      // Is a path mismatch (e.g. indexing a non-seq, or non-string key)
      return undefined;
    }
  }

  if (current == null) return undefined;
  return isScalar(current)
    ? current.value // ← return the primitive value.
    : current; //      ← return raw node for collections (Map/Seq).
}
