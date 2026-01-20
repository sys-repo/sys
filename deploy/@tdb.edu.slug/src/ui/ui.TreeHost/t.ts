import type { t } from './common.ts';

/** Type re-exports. */
export type * from './t.controller.ts';
export type * from './t.data.ts';

/**
 * Split layout with main tree navigation.
 */
export type TreeHostLib = {
  readonly UI: t.FC<TreeHostProps>;
  readonly Data: t.TreeHostDataLib;
  readonly Controller: t.TreeHostControllerLib;
};

/**
 * Component:
 */
export type TreeHostProps = {
  slots?: t.TreeHostSlots;
  tree?: t.TreeViewNodeList;
  split?: t.Percent[];
  selectedPath?: t.ObjectPath;

  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
  onSplitChange?: (args: { readonly split: t.Percent[] }) => void;

  /**
   * User intent: request a new selection path (e.g. clicked a branch node).
   * The parent is expected to set `selectedPath` in response.
   */
  onPathRequest?: TreeHostPathChangeHandler;

  /**
   * Observation: fires when `selectedPath` changes (any source),
   * de-duped (only when actually changed).
   */
  onPathChange?: TreeHostPathChangeHandler;

  /**
   * User intent: terminal (leaf) node selected.
   * No navigation implied; meaning is defined by the controller.
   */
  onLeafSelect?: TreeHostLeafSelectHandler;
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
export type TreeHostLeafSelectHandler = (e: TreeHostLeafSelect) => void;

/**
 * Event payloads:
 */
export type TreeHostPathChange = {
  readonly tree: t.TreeViewNodeList;
  readonly path: t.ObjectPath;
};

export type TreeHostLeafSelect = {
  readonly tree: t.TreeViewNodeList;
  readonly path: t.ObjectPath;
  readonly node: t.TreeViewNode;
};
