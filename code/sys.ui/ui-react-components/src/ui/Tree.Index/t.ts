import type { t } from './common.ts';
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

/**
 * Component:
 */
export type IndexTreeProps = {
  root?: t.TreeNode | t.TreeNodeList;
  minWidth?: t.Pixels;
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Node for an <IndexTree> view.
 * NB: The normalized shape of the YAML tree dialect.
 *
 * Ordering: siblings render in the order they appear in the normalized array.
 * (When authoring in YAML, use a sequence to force order, or rely on parser insertion order.)
 *
 */
export type TreeNode = {
  /** Unique path (stable). */
  key: string;
  /** Display label. */
  label: string | t.JSX.Element;
  /** Leaf payload OR node data payload. */
  value?: unknown;
  /** Presence → branch. */
  children?: ReadonlyArray<TreeNode>;
  /** Pass-through of `.` from the YAML dialect. */
  meta?: Readonly<Record<string, unknown>>;
};

/** A list of tree-nodes. */
export type TreeNodeList = ReadonlyArray<TreeNode>;
