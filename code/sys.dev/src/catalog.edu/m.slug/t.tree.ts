import type { t } from './common.ts';

/**
 * Trees of Slugs.
 */
export type SlugTreeLib = {
  /** Extracts the inline surface fields from a tree node. */
  fromNode(node?: t.SlugTreeItem): t.SlugSurface;

  readonly Is: {
    /** True iff `u` satisfies the core SlugTree props schema. */
    props(u: unknown): u is t.SlugTreeProps;
  };
};
