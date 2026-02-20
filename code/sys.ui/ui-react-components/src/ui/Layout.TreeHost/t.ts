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

/** Data helper surface delegated from `IndexTreeView.Data`. */
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
  parts?: TreeHostParts;

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

/** Navigation panel sizing and animation settings. */
export type TreeHostNav = {
  readonly width?: t.Pixels;
  readonly animate?: TreeHostNavAnimate;
};

/** Navigation transition options for path changes. */
export type TreeHostNavAnimate = {
  readonly duration?: t.Msecs;
  readonly ease?: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut';
};

/** Visual part overrides for TreeHost regions. */
export type TreeHostParts = {
  nav?: TreeHostPartNav;
  main?: TreeHostPartMain;
};

/** Style overrides for the navigation region. */
export type TreeHostPartNav = {
  background?: TreeHostPartBackground;
};

/** Style overrides for the main content region. */
export type TreeHostPartMain = {
  background?: TreeHostPartBackground;
};

/** Background override input for host regions (toggle or theme-aware callback). */
export type TreeHostPartBackground = boolean | ((e: { theme: t.CommonTheme }) => t.StringHex);

/**
 * Event handlers:
 */
export type TreeHostPathChangeHandler = (e: TreeHostPathChange) => void;
/** Handler invoked when a specific node is pressed by the user. */
export type TreeHostNodeSelectHandler = (e: TreeHostNodeSelect) => void;

/**
 * Event payloads:
 */
export type TreeHostPathChange = {
  readonly tree: t.TreeHostViewNodeList;
  readonly path: t.ObjectPath;
};

/** Payload for node selection interactions emitted by TreeHost. */
export type TreeHostNodeSelect = {
  readonly tree: t.TreeHostViewNodeList;
  readonly path: t.ObjectPath;
  readonly node: t.TreeHostViewNode;
  readonly is: { readonly leaf: boolean };
};
