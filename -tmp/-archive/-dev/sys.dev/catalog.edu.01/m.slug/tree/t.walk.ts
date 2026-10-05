import type { t } from '../common.ts';

/** Visitor called for each slug node. */
export type SlugTreeWalkVisit = (e: SlugTreeWalkEvent) => void;

/** Args for each visited slug node during a tree walk. */
export type SlugTreeWalkEvent = {
  /** Discriminated parent container: either root or the owning 'slugs' array. */
  readonly parent: SlugTreeWalkParent;

  /** Absolute object-path to the current node. */
  readonly path: t.ObjectPath;

  /** Index within `parent.array` when kind==='array'. */
  readonly key: number;

  /** The current node value. */
  readonly value: t.SlugTreeItem;

  /** Surface projection of the node (description/ref/traits/data). */
  readonly surface: t.SlugSurface;

  /** Stop the entire walk. */
  stop(): void;
};

/** Discriminated parent container: either root or the owning 'slugs' array. */
export type SlugTreeWalkParent =
  | { readonly kind: 'root' }
  | {
      readonly kind: 'array';
      /** The inline node that owns this 'slugs' array (schema guarantees inline here). */
      readonly parentNode: t.SlugTreeItemInline;
      /** The array containing this node. */
      readonly array: readonly t.SlugTreeItem[];
    };
