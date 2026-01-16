import type { t } from './common.ts';

/**
 * Pure data adapters for `Layout.TreeSplit`.
 *
 * Responsibility:
 * - Transform domain tree data into `Tree.Index` data.
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
export type LayoutTreeSplitDataLib = {
  /**
   * Convert a slug-tree into a Tree.Index root.
   *
   * Guarantees:
   * - Stable ordering.
   * - Deterministic `path` and `key`.
   * - Always returns a `TreeNodeList`.
   */
  readonly fromSlugTree: (
    tree: t.SlugTreeProps,
    opts?: t.LayoutTreeSplitFromSlugTreeOpts,
  ) => t.TreeNodeList;
};

/** Minimal, structural options only. */
export type LayoutTreeSplitFromSlugTreeOpts = {
  /** Label strategy for Tree nodes. Default: `'slug'`. */
  readonly label?: 'slug' | 'slug+description';
};
