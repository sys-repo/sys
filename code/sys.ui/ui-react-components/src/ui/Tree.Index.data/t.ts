import type { t } from './common.ts';
export type * from './t.yaml.ts';

/**
 * Flag evaluators:
 */
export type IndexTreeIsLib = {
  list(x: t.TreeNode | t.TreeNodeList): x is t.TreeNodeList;
  node(x: t.TreeNode | t.TreeNodeList): x is t.TreeNode;
};

/**
 * Namespace of data utilities.
 */
export type IndexTreeDataLib = {
  /** Flag evaluators */
  Is: t.IndexTreeIsLib;
  /** YAML dialect tools: */
  Yaml: t.IndexTreeYamlLib;

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

/**
 * Node for an <IndexTree> view.
 * NB: The normalized shape of the YAML tree dialect.
 *
 * Ordering: siblings render in the order they appear in the normalized array.
 * (When authoring in YAML, use a sequence to force order, or rely on parser insertion order.)
 *
 */
export type TreeNode = {
  /** Canonical path as array of segments (source of truth). */
  path: t.ObjectPath;

  /** Stable identifier derived from `path` (RFC6901-escaped). */
  key: string;

  /** Display label (string or JSX). */
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
