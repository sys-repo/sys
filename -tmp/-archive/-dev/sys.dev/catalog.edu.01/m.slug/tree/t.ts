import type { t } from '../common.ts';

export type * from './t.walk.ts';

/**
 * Trees of Slugs.
 */
export type SlugTreeLib = {
  /** Extracts the inline surface fields from a tree node. */
  fromNode(node?: t.SlugTreeItem): t.SlugSurface;

  /** Depth-first walk over tree, visiting nodes that present as slugs. */
  walk(root: unknown, visit: t.SlugTreeWalkVisit): void;

  /** Type guards. */
  readonly Is: t.SlugTreeIsLib;
};

/**
 * Type guards.
 */
export type SlugTreeIsLib = {
  /** True iff `u` satisfies the core SlugTree props schema. */
  props(u: unknown): u is t.SlugTreeProps;

  /** True iff `u` is a valid slug-tree item (ref-only or inline). */
  item(u: unknown): u is t.SlugTreeItem;

  /** True iff `u` is an inline slug-tree item (no `ref`). */
  itemInline(u: unknown): u is t.SlugTreeItemInline;

  /** True iff `u` is a ref-only slug-tree item (has `ref`). */
  itemRef(u: unknown): u is t.SlugTreeItemRefOnly;
};
