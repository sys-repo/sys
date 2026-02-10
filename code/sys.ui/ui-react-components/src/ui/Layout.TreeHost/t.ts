import type { t } from './common.ts';

/** Type re-exports. */
export type * from './t.node.ts';
export type * from './t.slots.ts';

/**
 * Split layout with main tree navigation.
 */
export type TreeHostLib = {
  readonly UI: t.FC<TreeHostProps>;
  readonly Data: TreeHostDataLib;
};

export type TreeHostDataLib = t.IndexTreeViewDataLib;

/**
 * Component:
 */
export type TreeHostProps = {
  slots?: t.TreeHostSlots;
  tree?: t.TreeHostViewNodeList;
  selectedPath?: t.ObjectPath;
  spinner?: t.TreeHostSpinner | t.TreeHostSpinner[];
  nav?: TreeHostNav;

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

export type TreeHostNav = {
  readonly width?: t.Pixels;
  readonly animate?: TreeHostNavAnimate;
};

export type TreeHostNavAnimate = {
  readonly duration?: t.Msecs;
  readonly ease?: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut';
};

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
