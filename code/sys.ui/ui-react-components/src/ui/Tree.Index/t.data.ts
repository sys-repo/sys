import { type t } from './common.ts';

/**
 * Namespace of data utilities.
 */
export type IndexTreeDataLib = {
  /**
   * Get children at a path ('', 'a/b/c', or ['a','b','c']).
   * Path segments match either the literal segment or an `id` override from `meta.id`.
   */
  at(root: t.TreeNodeList, path: t.ObjectPath): t.TreeNodeList;

  /**
   * Find a node by exact `key` (full path) or by predicate.
   */
  find(
    root: t.TreeNodeList,
    keyOr: string | ((n: { node: any; parents: ReadonlyArray<any> }) => boolean),
  ): t.TreeNode | undefined;
};
