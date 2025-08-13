import type { t } from './common.ts';

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
