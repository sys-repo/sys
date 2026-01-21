import type { t } from './common.ts';

/**
 * Pure data adapters for `TreeHost`.
 *
 * Responsibility:
 * - Transform domain tree data between the UI `Tree.Index`
 *   and `slug-tree` structures.
 *
 * Constraints:
 * - Pure functions only (no React, no IO, no Signals).
 * - Types are derived from upstream public APIs:
 *   - `slug.SlugTree`
 *   - `Tree.Index.data`
 * - No selection, no view state, no persistence.
 *
 * This namespace defines the *only* supported data boundary
 * between domain trees and the Tree UI.
 */
export type TreeHostDataLib = {
  readonly Client: t.SlugClientLib;

  /**
   * Convert a slug-tree into a Tree.Index root.
   * Guarantees:
   * - Stable ordering.
   * - Deterministic `path` and `key`.
   * - Always returns a `TreeNodeList`.
   */
  readonly fromSlugTree: (
    tree: t.SlugTreeItems,
    opts?: t.TreeHostFromSlugTreeOpts,
  ) => t.TreeHostViewNodeList;

  /**
   * TreeView slug-path lookup (pure); returns the matching SlugTreeItem.
   */
  readonly findNode: (
    tree: t.SlugTreeItems | undefined,
    path: t.ObjectPath | undefined,
  ) => t.SlugTreeItem | undefined;

  /**
   * TreeView path lookup (pure); returns the matching TreeViewNode.
   * Use when you only have the UI tree structure (TreeHostViewNodeList)
   * and want to resolve selection state (`path`) back to the node payload.
   */
  readonly findViewNode: (
    tree: t.TreeHostViewNodeList | undefined,
    path: t.ObjectPath | undefined,
  ) => t.TreeHostViewNode | undefined;
};

/** Minimal, structural options only. */
export type TreeHostFromSlugTreeOpts = {
  /** Label strategy for Tree nodes. Default: `'slug'`. */
  readonly label?: 'slug' | 'slug+description';
};
