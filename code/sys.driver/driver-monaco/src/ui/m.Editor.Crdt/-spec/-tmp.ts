import type { Node, Pair, Scalar, YAMLMap, YAMLSeq } from 'yaml';
import * as YAML from 'yaml';

import { type t } from '../common.ts';

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
export function parseYaml(src: string): YAML.Document.Parsed {
  return YAML.parseDocument(src, { keepSourceTokens: true });
}

/**
 * Find the deepest node whose range encloses `offset` and
 * return the logical object path leading to it.
 */
export const pathAtOffset = (
  node: Node | null | undefined,
  offset: number,
  path: t.ObjectPath = [],
): t.ObjectPath => {
  if (!node || !node.range) return [];

  const [start, , end] = node.range; // valueStart, valueEnd, nodeEnd  [oai_citation:0‡eemeli.org](https://eemeli.org/yaml/)
  if (offset < start || offset > end) return [];

  // Scalars are leaves – we're done.
  if (YAML.isScalar(node as Scalar)) return path;

  if (YAML.isSeq(node as YAMLSeq)) {
    return (node as YAMLSeq).items.reduce<t.ObjectPath>((found, item, idx) => {
      return found.length ? found : pathAtOffset(item as any, offset, [...path, idx]);
    }, []);
  }

  if (YAML.isMap(node as YAMLMap)) {
    for (const pair of (node as YAMLMap).items as Pair[]) {
      const { key, value } = pair as any; // TEMP 🐷

      // Cursor inside key → path *to* the key itself.
      if (key?.range && offset >= key.range[0] && offset <= key.range[2]) {
        const k = YAML.isScalar(key) ? String(key.value) : String(key.toString());
        return [...path, k];
      }

      // Cursor inside value → dive deeper (or return value path).
      if (value?.range && offset >= value.range[0] && offset <= value.range[2]) {
        const k = YAML.isScalar(key) ? String(key.value) : String(key.toString());
        const sub = pathAtOffset(value, offset, [...path, k]);
        return sub.length ? sub : [...path, k];
      }
    }
  }

  return path; // fallback (node encloses cursor but no child does)
};

/**
 * Wire everything to an editor instance.
 * Re-parse on buffer edits; emit path on every cursor move.
 */
export const observeYamlPath = (editor: t.Monaco.Editor, onPath: (p: t.ObjectPath) => void) => {
  const model = editor.getModel();
  if (!model) throw new Error('editor has no model');

  let doc = parseYaml(model.getValue());

  // ①  Re-parse when the buffer changes (debounce/throttle if needed)
  model.onDidChangeContent(() => {
    doc = parseYaml(model.getValue());
  });

  // ②  Watch the caret
  editor.onDidChangeCursorPosition((e) => {
    const offset = model.getOffsetAt(e.position); // Monaco helper
    const path = pathAtOffset(doc.contents, offset);
    onPath(path);
  });
};
