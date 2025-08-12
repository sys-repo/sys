import type { t } from './common.ts';
export type * from './t.node.ts';
export type * from './t.ui.ts';
export type * from './t.yaml.ts';

/**
 * Index Tree library API:
 */
export type IndexTreeLib = Readonly<{
  /** Flag evaluators */
  Is: t.IndexTreeIsLib;
  /** <IndexTree> component view: */
  View: React.FC<t.IndexTreeProps>;
  /** Individual item/node tools: */
  Item: Readonly<{ View: React.FC<t.IndexTreeItemProps> }>;
  /** YAML dialect tools: */
  Yaml: t.IndexTreeYamlLib;

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
}>;

/**
 * Flag evaluators:
 */
export type IndexTreeIsLib = {
  list(x: t.TreeNode | t.TreeNodeList): x is t.TreeNodeList;
  node(x: t.TreeNode | t.TreeNodeList): x is t.TreeNode;
};
