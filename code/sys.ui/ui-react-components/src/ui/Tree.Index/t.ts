import type { t } from './common.ts';
export type * from './t.ui.ts';

/**
 * Index Tree library API:
 */
export type IndexTreeLib = {
  /** <IndexTree> component view: */
  View: React.FC<t.IndexTreeProps>;
  /** Individual item/node tools: */
  Item: { View: React.FC<t.IndexTreeItemProps> };
  /** Flag evaluators */
  Is: t.IndexTreeIsLib;
  /** Data utilities: */
  Data: t.IndexTreeDataLib;
  /** YAML dialect tools: */
  Yaml: t.IndexTreeYamlLib;
};

/**
 * Flag evaluators:
 */
export type IndexTreeIsLib = {
  list(x: t.TreeNode | t.TreeNodeList): x is t.TreeNodeList;
  node(x: t.TreeNode | t.TreeNodeList): x is t.TreeNode;
};
