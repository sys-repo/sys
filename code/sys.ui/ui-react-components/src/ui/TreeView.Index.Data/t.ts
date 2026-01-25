import type { t } from './common.ts';

/** Type re-export. */
export type * from './t.node.ts';
export type * from './t.yaml.ts';

/** A node paired with its indentation depth for inline rendering. */
export type TreeViewNodeView = { node: t.TreeViewNode; depth: number };

/** Flag evaluators. */
export type IndexTreeViewIsLib = {
  list(x: t.TreeViewNode | t.TreeViewNodeList): x is t.TreeViewNodeList;
  node(x: t.TreeViewNode | t.TreeViewNodeList): x is t.TreeViewNode;
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
  at(root: t.TreeViewNodeList, path: t.ObjectPath | string): t.TreeViewNodeList;

  /**
   * Get a flat list of nodes to render at the given path, with depth info.
   * Nodes with `self.inline: true` have their children expanded in-place
   * with incremented depth for indentation.
   */
  viewAt(root: t.TreeViewNodeList, path: t.ObjectPath | string): t.TreeViewNodeView[];

  /**
   * Find a node by exact `key` (full path) or by predicate.
   */
  find(
    root: t.TreeViewNodeList,
    keyOr: string | ((n: { node: any; parents: ReadonlyArray<any> }) => boolean),
  ): t.TreeViewNode | undefined;
  /**
   * Coerce a `root` into a `TreeViewNodeList`.
   *
   * - `undefined` → `[]`
   * - `TreeViewNodeList` → same list
   * - `TreeNode` with `children` → that `children` list
   * - `TreeNode` without `children` → `[root]`
   *
   * This is the single helper the view uses to decide what to render at the current level.
   */
  toList(root?: t.TreeViewNode | t.TreeViewNodeList): t.TreeViewNodeList;

  /**
   * Determine if the node is bearing child nodes.
   */
  hasChildren(node: t.TreeViewNode): boolean;
};
