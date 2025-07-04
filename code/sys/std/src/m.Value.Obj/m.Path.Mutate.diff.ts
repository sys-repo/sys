import { type t, isPlainObject } from './common.ts';
import { set } from './m.Path.Mutate.set.ts';

type O = Record<string, unknown>;
type Path = t.ObjectPath;

/**
 * Compare `target` with `source`, mutate `target` until it equals `source`,
 * and return a report of every change.  Cycle-safe.
 */
export function diff<T extends O = O>(target: T, source: T): t.ObjDiffReport {
  const ops: t.ObjDiffOp[] = [];

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
    // Only objects (plain or array) can participate in cycles.
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
    if (Object.is(aNode, bNode)) return; //   Identical primitives *or* same reference.
    if (alreadySeen(aNode, bNode)) return; // Avoid infinite recursion on cycles.

    // Plain objects:
    if (isPlainObject(aNode) && isPlainObject(bNode)) {
      const keys = new Set([...Object.keys(aNode), ...Object.keys(bNode)]);
      for (const key of keys) {
        const next = [...path, key];
        const aHas = key in aNode;
        const bHas = key in bNode;

        if (!bHas) {
          ops.push({ type: 'remove', path: next, prev: (aNode as O)[key] });
          set(target, next, undefined);
          continue;
        }
        if (!aHas) {
          ops.push({ type: 'add', path: next, value: (bNode as O)[key] });
          set(target, next, (bNode as O)[key]);
          continue;
        }
        walk(next, (aNode as O)[key], (bNode as O)[key]); // 🌳 ← recursion:
      }
      return;
    }

    // Arrays:
    if (Array.isArray(aNode) && Array.isArray(bNode)) {
      const same = aNode.length === bNode.length && aNode.every((v, i) => Object.is(v, bNode[i]));
      if (!same) {
        ops.push({ type: 'array', path, prev: aNode, next: bNode });
        set(target, path, [...bNode]);
      }
      return;
    }

    // Primitives or constructor mismatch:
    ops.push({ type: 'update', path, prev: aNode, next: bNode });
    set(target, path, bNode);
  }
}
