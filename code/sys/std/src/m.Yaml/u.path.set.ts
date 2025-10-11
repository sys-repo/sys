import type { Node } from 'yaml';
import { isMap, isScalar, isSeq, Scalar, YAMLMap, YAMLSeq } from 'yaml';

import type { t } from './common.ts';
import { deepGet } from './u.path.get.ts';

/**
 * Mutates `doc.contents` at `path`, setting `value` (or deleting if `value === undefined`).
 * Emits an `ObjDiffOp` (or `undefined` if no structural change).
 */
export function deepSet(
  doc: t.YamlAst,
  path: t.ObjectPath,
  value: unknown,
): t.ObjDiffOp | undefined {
  let parent: Node | null | undefined = doc.contents;

  // Capture old value/root for diff:
  const prev = deepGet(doc.contents, path);

  if (path.length === 0) {
    const newNode = doc.createNode(value) as Node;
    doc.contents = newNode as any;

    if (prev === undefined) {
      return { type: 'add', path, value };
    }

    // Full-array replace on root: detect AST Sequence or JS array
    if (isSeq(prev) && Array.isArray(value)) {
      // unwrap YAMLSeq to JS array
      const prevArr = (prev as YAMLSeq<unknown>).items.map((item) =>
        isScalar(item) ? (item as Scalar).value : item,
      );
      return { type: 'array', path, prev: prevArr, next: value as unknown[] };
    }
    if (Array.isArray(prev) && Array.isArray(value)) {
      return { type: 'array', path, prev: prev as unknown[], next: value as unknown[] };
    }

    return { type: 'update', path, prev, next: value };
  }

  // DESCEND: build intermediate structures (maps / arrays):
  for (let i = 0; i < path.length - 1; i++) {
    const seg = path[i];
    const nextSeg = path[i + 1];
    const nextIsIndex = typeof nextSeg === 'number';

    if (parent == null || (!isMap(parent) && !isSeq(parent))) return undefined;

    parent = ensureChild(
      doc,
      parent as YAMLMap<unknown, unknown> | YAMLSeq<unknown>,
      seg as string | number,
      nextIsIndex,
    );
  }

  // APPLY at leaf:
  const leafKey = path[path.length - 1];

  // TARGET: parent must now be {Map} or [Seq]:
  if (parent == null || (!isMap(parent) && !isSeq(parent))) return undefined;

  // {MAP} leaf:
  if (isMap(parent) && typeof leafKey === 'string') {
    const map = parent as YAMLMap<unknown, unknown>;

    if (value === undefined) {
      // Delete:
      const idx = map.items.findIndex((p) => isScalar(p.key) && p.key.value === leafKey);
      if (idx >= 0) {
        map.items.splice(idx, 1);
        return { type: 'remove', path, prev };
      }
      return undefined;
    }

    // Add / update:
    const existing = map.items.find((p) => isScalar(p.key) && p.key.value === leafKey);
    if (existing) {
      existing.value = doc.createNode(value) as Node;

      if (isSeq(prev) && Array.isArray(value)) {
        const prevArr = (prev as YAMLSeq<unknown>).items.map((item) => {
          return isScalar(item) ? (item as Scalar).value : item;
        });
        return { type: 'array', path, prev: prevArr, next: value as unknown[] };
      } else if (Array.isArray(prev) && Array.isArray(value)) {
        return { type: 'array', path, prev: prev as unknown[], next: value as unknown[] };
      }
      return { type: 'update', path, prev, next: value };
    }
    // Add new:
    map.items.push(doc.createPair(leafKey, value));
    return { type: 'add', path, value };
  }

  // [SEQ] leaf:
  if (isSeq(parent) && typeof leafKey === 'number') {
    const seq = parent as YAMLSeq<unknown>;
    const idx = leafKey;

    if (value === undefined) {
      if (idx >= 0 && idx < seq.items.length) {
        const removed = seq.items.splice(idx, 1)[0];
        const prevVal = isScalar(removed) ? removed.value : removed;
        return { type: 'remove', path, prev: prevVal };
      }
      return undefined;
    }

    const newNode = doc.createNode(value) as Node;

    if (idx >= 0 && idx < seq.items.length) {
      seq.items[idx] = newNode;
      if (Array.isArray(prev) && Array.isArray(value)) {
        return { type: 'array', path, prev: prev as unknown[], next: value as unknown[] };
      } else {
        return { type: 'update', path, prev, next: value };
      }
    }

    // Append / pad as needed:
    while (seq.items.length < idx) seq.items.push(doc.createNode(null) as Node);
    seq.items[idx] = newNode;
    return { type: 'add', path, value };
  }

  return undefined;
}

/**
 * Walk down `parent` (a YAMLMap or YAMLSeq) and return the child Node for `key`.
 * If it doesn’t exist, create it (map → {}, seq → []) so traversal can continue.
 */
function ensureChild(
  doc: t.YamlAst,
  parent: YAMLMap<unknown, unknown> | YAMLSeq<unknown>,
  key: string | number,
  nextIsIndex: boolean,
): Node {
  if (isMap(parent)) {
    const map = parent as YAMLMap<unknown, unknown>;
    let pair = map.items.find((p) => isScalar(p.key) && (p.key as Scalar).value === key);
    if (!pair) {
      const newPair = doc.createPair(key, nextIsIndex ? [] : {});
      map.items.push(newPair);
      return newPair.value as Node;
    }
    return pair.value as Node;
  }

  // Parent is [YAMLSeq]:
  const seq = parent as YAMLSeq<unknown>;
  const idx = key as number;
  let child = seq.items[idx];
  if (!child) {
    // Pad with nulls if needed:
    while (seq.items.length < idx) seq.items.push(doc.createNode(null) as Node);
    child = doc.createNode(nextIsIndex ? [] : {}) as Node;
    seq.items[idx] = child;
  }

  return child as Node;
}
