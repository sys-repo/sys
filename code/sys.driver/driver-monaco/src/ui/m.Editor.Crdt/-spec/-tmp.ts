import type * as YamlType from 'yaml';
import * as YAML from 'yaml';

import { type t } from '../common.ts';

type Range = [number, number, number];

/** Re-usable alias so Pair.key/value are `Node | null`, not `unknown`. */
type NodeOrNull = YamlType.Node | null;
type YAMLPair = YamlType.Pair<NodeOrNull, NodeOrNull>;

/**
 * 🐷
 */
export function tmp(editor: t.Monaco.Editor) {
  observeYamlPath(editor, (path) => {
    console.log('current YAML path →', path);
  });
}

/**
 * Parse once – keep source tokens so each node has .range,
 * and reuse the resulting Document until the buffer changes.
 */
export function parseYaml(src: string): YamlType.Document.Parsed {
  return YAML.parseDocument(src, { keepSourceTokens: true });
}

/**
 * Wire everything to an editor instance.
 * Re-parse on buffer edits; emit path on every cursor move.
 */
export const observeYamlPath = (editor: t.Monaco.Editor, onPath: (p: t.ObjectPath) => void) => {
  const model = editor.getModel();
  if (!model) throw new Error('editor has no model');

  let doc = parseYaml(model.getValue());

  // Re-parse when the buffer changes (debounce/throttle if needed):
  model.onDidChangeContent(() => {
    doc = parseYaml(model.getValue());
  });

  // Watch the caret:
  editor.onDidChangeCursorPosition((e) => {
    const offset = model.getOffsetAt(e.position); // Monaco helper.
    const path = pathAtOffset(doc.contents, offset);
    onPath(path);
  });
};

type PathAtOffsetNodeParam = YamlType.Node | null | undefined;

/**
 * Find the deepest node whose range encloses `offset`
 * and return the logical object path leading to it.
 */
export const pathAtOffset = (
  node: PathAtOffsetNodeParam,
  offset: number,
  path: t.ObjectPath = [],
): t.ObjectPath => {
  if (!node || !node.range) return [];

  const [start, , end] = node.range as Range;
  if (offset < start || offset > end) return [];

  /**
   * If `node` is a scalar it has no children, so the current `path` is final.
   *
   * YAML → JS scalar mapping:
   * - `null`
   * - `boolean`
   * - `number`
   * - `string`
   * - `bigint`      ← (when `intAsBigInt: true`)
   * - `Date`        ← (for `!!timestamp`)
   * - `Uint8Array`  ← (for `!!binary`)
   */
  if (YAML.isScalar(node as YamlType.Scalar)) return path;

  /**
   * [Array] sequences:
   */
  type S = YamlType.YAMLSeq<PathAtOffsetNodeParam>;
  if (YAML.isSeq(node as YamlType.YAMLSeq)) {
    return (node as YamlType.YAMLSeq<S>).items.reduce<t.ObjectPath>((found, item, idx) => {
      return found.length ? found : pathAtOffset(item, offset, [...path, idx]);
    }, []);
  }

  /**
   * {Maps}:
   */
  if (YAML.isMap(node as YamlType.YAMLMap)) {
    for (const pair of (node as YamlType.YAMLMap).items as YAMLPair[]) {
      const key = pair.key;
      const value = pair.value;

      if (!key) continue; // Skip null keys.

      const keyStr = YAML.isScalar(key) ? String(key.value) : String(key.toString());

      const kPath = [...path, keyStr];
      const kRange = key.range as Range | undefined;
      const vRange = value?.range as Range | undefined;

      // Caret inside the key:
      if (kRange && offset >= kRange[0] && offset <= kRange[2]) return kPath;

      // Caret in the colon / whitespace gap (treat as "on the key"):
      if (kRange && vRange && offset > kRange[2] && offset < vRange[0]) return kPath;
      if (kRange && !vRange && offset > kRange[2]) return kPath;

      // Caret inside the value (recurse):
      if (vRange && offset >= vRange[0] && offset <= vRange[2]) {
        const sub = pathAtOffset(value, offset, kPath);
        return sub.length ? sub : kPath;
      }
    }
  }

  // Caret is inside `node` but not any child.
  return path;
};
