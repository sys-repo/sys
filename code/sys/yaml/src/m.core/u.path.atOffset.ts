import type * as Y from 'yaml';
import { isMap, isScalar, isSeq } from 'yaml';
import { type t } from './common.ts';

type NodeOrNull = Y.Node | null | undefined;
type YAMLPair = Y.Pair<NodeOrNull, NodeOrNull>;

export const atOffset: t.YamlPathLib['atOffset'] = (node, offset, path = []) => {
  if (!node || !node.range) return [];

  const [start, , end] = node.range as Y.Range;
  if (offset < start || offset > end) return [];

  /**
   * If `node` is a scalar it has no children, so the current `path` is final.
   * YAML → JS scalar mapping:
   *  - `null`
   *  - `boolean`
   *  - `number`
   *  - `string`
   *  - `bigint`      ← (when `intAsBigInt: true`)
   *  - `Date`        ← (for `!!timestamp`)
   *  - `Uint8Array`  ← (for `!!binary`)
   */
  if (isScalar(node as Y.Scalar)) return path;

  /**
   * [Array] sequences:
   */
  type S = Y.YAMLSeq<NodeOrNull>;
  if (isSeq(node as Y.YAMLSeq)) {
    return (node as Y.YAMLSeq<S>).items.reduce<t.ObjectPath>((found, item, idx) => {
      return found.length ? found : atOffset(item, offset, [...path, idx]);
    }, []);
  }

  /**
   * { Maps }:
   */
  if (isMap(node as Y.YAMLMap)) {
    for (const pair of (node as Y.YAMLMap).items as YAMLPair[]) {
      const key = pair.key;
      const value = pair.value;

      if (!key) continue; // Skip null keys.

      const keyStr = isScalar(key) ? String(key.value) : String(key.toString());

      const kPath = [...path, keyStr];
      const kRange = key.range as Y.Range | undefined;
      const vRange = value?.range as Y.Range | undefined;

      // Caret inside the key:
      if (kRange && offset >= kRange[0] && offset <= kRange[2]) return kPath;

      // Caret in the colon / whitespace gap (treat as "on the key"):
      if (kRange && vRange && offset > kRange[2] && offset < vRange[0]) return kPath;
      if (kRange && !vRange && offset > kRange[2]) return kPath;

      // Caret inside the value (recurse):
      if (vRange && offset >= vRange[0] && offset <= vRange[2]) {
        const sub = atOffset(value, offset, kPath);
        return sub.length ? sub : kPath;
      }
    }
  }

  // Caret is inside `node` but not any child.
  return path;
};
