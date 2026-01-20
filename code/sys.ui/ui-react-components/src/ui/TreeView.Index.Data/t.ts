import type { t } from './common.ts';

/** Type re-export. */
export type * from './t.node.ts';
export type * from './t.yaml.ts';

/** Flag evaluators. */
export type IndexTreeViewIsLib = {
  list(x: t.TreeNode | t.TreeNodeList): x is t.TreeNodeList;
  node(x: t.TreeNode | t.TreeNodeList): x is t.TreeNode;
};

/** Namespace of data utilities. */
export type IndexTreeViewDataLib = {
  /** Flag evaluators */
  Is: t.IndexTreeViewIsLib;
  /** YAML dialect tools */
  Yaml: t.IndexTreeViewYamlLib;

  /**
   * Get children at a path ('' | 'a/b/c' | ['a','b','c']).
   * Path segments match either the literal segment or an `id` override from `meta.id`.
   */
  at(root: t.TreeNodeList, path: t.ObjectPath | string): t.TreeNodeList;

  /**
   * Find a node by exact `key` (full path) or by predicate.
   */
  find(
    root: t.TreeNodeList,
    keyOr: string | ((n: { node: any; parents: ReadonlyArray<any> }) => boolean),
  ): t.TreeNode | undefined;
  /**
   * Coerce a `root` into a `TreeNodeList`.
   *
   * - `undefined` → `[]`
   * - `TreeNodeList` → same list
   * - `TreeNode` with `children` → that `children` list
   * - `TreeNode` without `children` → `[root]`
   *
   * This is the single helper the view uses to decide what to render at the current level.
   */
  toList(root?: t.TreeNode | t.TreeNodeList): t.TreeNodeList;

  /**
   * Determine if the node is bearing child nodes.
   */
  hasChildren(node: t.TreeNode): boolean;
};
