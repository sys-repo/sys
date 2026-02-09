import type { t } from './common.ts';

/** Type re-exports. */
export type * from './t.node.ts';

/**
 * Split layout with main tree navigation.
 */
export type TreeHostLib = {
  readonly UI: t.FC<TreeHostProps>;
  readonly Data: TreeHostDataLib;
};

export type TreeHostDataLib = t.TreeDataLib & { readonly Client: t.SlugClientLib };

/**
 * Component:
 */
export type TreeHostProps = {
  slots?: t.TreeHostSlots;
  tree?: t.TreeHostViewNodeList;
  selectedPath?: t.ObjectPath;

  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;

  /**
   * User intent: request a new selection path (e.g. clicked a branch node).
   * The parent is expected to set `selectedPath` in response.
   */
  onPathRequest?: TreeHostPathChangeHandler;

  /**
   * Fires whenever the user presses a node (branch or leaf).
   * Provides the node and a leaf indicator.
   */
  onNodeSelect?: TreeHostNodeSelectHandler;
};

/** Slot registry definitions for TreeHost. */
export type TreeHostSlots = {
  tree?: t.ReactNode;
  main?: t.ReactNode;
  aux?: t.ReactNode;
  empty?: (slot: TreeHostSlot) => t.ReactNode;
};

/** Slot registry keys for TreeHost. */
export type TreeHostSlot = keyof TreeHostSlots;

/**
 * Event handlers:
 */
export type TreeHostPathChangeHandler = (e: TreeHostPathChange) => void;
export type TreeHostNodeSelectHandler = (e: TreeHostNodeSelect) => void;

/**
 * Event payloads:
 */
export type TreeHostPathChange = {
  readonly tree: t.TreeHostViewNodeList;
  readonly path: t.ObjectPath;
};

export type TreeHostNodeSelect = {
  readonly tree: t.TreeHostViewNodeList;
  readonly path: t.ObjectPath;
  readonly node: t.TreeHostViewNode;
  readonly is: { readonly leaf: boolean };
};
