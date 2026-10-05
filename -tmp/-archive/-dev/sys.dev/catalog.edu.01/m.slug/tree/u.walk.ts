import { type t, Obj } from '../common.ts';
import { Is as TreeIs } from './m.Is.ts';
import { fromNode } from './u.fromNode.ts';

/**
 * Depth-first walk over a slug-tree using Obj.walk.
 * Visits only valid SlugTreeItem nodes (ref-only or inline).
 */
export function walk(root: unknown, visit: t.SlugTreeWalkVisit): void {
  let halted = false;
  const stopAll = () => (halted = true);

  // Map 'slugs' arrays → owning inline node (for precise parent context).
  const owner = new WeakMap<readonly t.SlugTreeItem[], t.SlugTreeItemInline>();

  const emit = (parent: unknown, path: t.ObjectPath, key: number, node: t.SlugTreeItem) => {
    const parentCtx: t.SlugTreeWalkParent =
      Array.isArray(parent) && owner.has(parent)
        ? { kind: 'array', parentNode: owner.get(parent)!, array: parent }
        : { kind: 'root' };

    visit({
      parent: parentCtx,
      path,
      key,
      value: node,
      surface: fromNode(node),
      stop: stopAll,
    });
  };

  // Allow a single-node root (convenience).
  if (TreeIs.item(root)) {
    emit(undefined, [], 0, root);
    if (halted) return;
  }

  // General walk (covers root arrays and nested structures).
  Obj.walk(root as any, (e) => {
    if (halted) return e.stop();
    const { parent, path, key, value } = e;

    // Record owners: when we see ".slugs" arrays on an inline node, remember the parent inline.
    if (key === 'slugs' && Array.isArray(value) && TreeIs.itemInline(parent)) {
      owner.set(value, parent);
      return; // do not emit for the array slot itself
    }

    // Emit only for actual tree items.
    if (TreeIs.item(value)) {
      const numericKey = typeof key === 'number' ? key : 0;
      emit(parent, path, numericKey, value);
      if (halted) e.stop();
    }
  });
}
