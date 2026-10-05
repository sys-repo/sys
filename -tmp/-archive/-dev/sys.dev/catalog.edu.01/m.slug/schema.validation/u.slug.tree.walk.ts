import { type t, Is } from '../common.ts';

/**
 * DFS: Depth-first walk over SlugTree items, yielding {node, path} pairs.
 * - If `node` is an array, children live at `[…path, i]`.
 * - If `node` is an object, its children live at `[…path, 'slugs', i]`.
 * - Skips null/scalar slots (live YAML edits) without throwing.
 */
type SlugTreeVisit = {
  readonly node: t.SlugTreeItem;
  readonly path: t.ObjectPath;
};

export function* walkSlugTree(node: unknown, path: t.ObjectPath): IterableIterator<SlugTreeVisit> {
  // Array entrypoint (eg: base SlugTreeProps):
  if (Array.isArray(node)) {
    for (let i = 0; i < node.length; i++) {
      const child = node[i];
      if (!Is.record(child)) continue; // skip null/scalars
      const childPath = [...path, i] as t.ObjectPath;

      // Yield the item (not the array):
      yield { node: child as t.SlugTreeItem, path: childPath };

      // Descend into the child's slugs:
      const slugs = Array.isArray((child as { slugs?: unknown }).slugs)
        ? (child as { slugs: unknown[] }).slugs
        : [];
      if (slugs.length > 0) {
        yield* walkSlugTree(slugs, [...childPath, 'slugs'] as t.ObjectPath);
      }
    }
    return;
  }

  // Object entrypoint:
  if (!Is.record(node)) return; // skip null/scalars

  // Yield the current object node:
  yield { node: node as t.SlugTreeItem, path };

  // Descend into `.slugs` if present:
  const slugs = Array.isArray((node as { slugs?: unknown }).slugs)
    ? (node as { slugs: unknown[] }).slugs
    : [];
  if (slugs.length > 0) {
    yield* walkSlugTree(slugs, [...path, 'slugs'] as t.ObjectPath);
  }
}
