import { type t, clone, isPlainObject } from './common.ts';
import { set } from './m.Mutate.set.ts';

type O = Record<string, unknown>;
type Path = t.ObjectPath;

/**
 * Compare `target` with `source`, mutate `target` until it equals `source`,
 * and return a report of every change (cycle-safe).
 */
export function diff<T extends O = O>(
  source: T,
  target: T,
  options: t.ObjDiffOptions = {},
): t.ObjDiffReport {
  const { diffArrays = false } = options;
  const ops: t.ObjDiffOp[] = [];
  const pushOp = (op?: t.ObjDiffOp) => {
    if (op) ops.push(op);
  };

  /**
   * `seen` remembers every (aNode → bNode) pair we have visited.
   *  seen.get(a) === Set of b's already compared with a
   */
  const seen = new WeakMap<object, WeakSet<object>>();
  walk([], target as O, source as O);
  return {
    ops,
    stats: {
      adds: ops.filter((o) => o.type === 'add').length,
      removes: ops.filter((o) => o.type === 'remove').length,
      updates: ops.filter((o) => o.type === 'update').length,
      arrays: ops.filter((o) => o.type === 'array').length,
      total: ops.length,
    },
  };

  /**
   * Bail out if this (aNode,bNode) pair has already been visited:
   */
  function alreadySeen(aNode: unknown, bNode: unknown): boolean {
    // Only objects (plain or array) can participate in cycles:
    if (
      typeof aNode !== 'object' ||
      aNode === null ||
      typeof bNode !== 'object' ||
      bNode === null
    ) {
      return false;
    }
    let inner = seen.get(aNode as object);
    if (!inner) {
      inner = new WeakSet<object>();
      seen.set(aNode as object, inner);
    }
    if (inner.has(bNode as object)) return true; // Done this pair.
    inner.add(bNode as object);
    return false;
  }

  /**
   * Walk the tree:
   */
  function walk(path: Path, aNode: unknown, bNode: unknown): void {
    if (Object.is(aNode, bNode)) return; //   Identical primitives OR same reference.
    if (alreadySeen(aNode, bNode)) return; // Avoid infinite recursion on cycles.

    // Plain objects:
    if (isPlainObject(aNode) && isPlainObject(bNode)) {
      const keys = new Set([...Object.keys(aNode), ...Object.keys(bNode)]);
      for (const key of keys) {
        const next = [...path, key];
        const aHas = key in aNode;
        const bHas = key in bNode;

        if (!bHas) {
          pushOp(set(target, next, undefined));
          continue;
        }
        if (!aHas) {
          pushOp(set(target, next, (bNode as O)[key]));
          continue;
        }
        walk(next, (aNode as O)[key], (bNode as O)[key]); // 🌳 ← recursion:
      }
      return;
    }

    // Arrays:
    if (Array.isArray(aNode) && Array.isArray(bNode)) {
      if (diffArrays) {
        walkArray(bNode, aNode, path); // Fine-grained diff.
      } else {
        const same = aNode.length === bNode.length && aNode.every((v, i) => Object.is(v, bNode[i]));
        if (!same) pushOp(set(target, path, [...bNode]));
      }
      return;
    }

    // Primitives or constructor mismatch:
    pushOp(set(target, path, bNode));
  }

  function walkArray(src: unknown[], trg: unknown[], base: Path) {
    const max = Math.max(src.length, trg.length);
    for (let i = 0; i < max; i += 1) {
      const path = [...base, i] as Path;
      const s = src[i];
      const t = trg[i];

      if (t === undefined && s !== undefined) {
        trg[i] = clone(s);
        pushOp({ type: 'add', path, value: s });
      } else if (s === undefined && t !== undefined) {
        delete trg[i];
        pushOp({ type: 'remove', path, prev: t });
      } else if (!Object.is(s, t)) {
        if (typeof s === 'object' && typeof t === 'object') {
          walk(path, t, s); // ← recursion 🌳
        } else {
          trg[i] = clone(s);
          pushOp({ type: 'update', path, prev: t, next: s });
        }
      }
    }

    if (trg.length > src.length) trg.length = src.length; // ← trim any trailing holes.
  }
}
