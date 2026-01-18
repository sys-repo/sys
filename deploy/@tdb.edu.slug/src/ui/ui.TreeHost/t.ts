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
  root?: t.TreeNodeList;
  split?: t.Percent[];
  selectedPath?: t.ObjectPath;

  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
  onPathChange?: (args: { path: t.ObjectPath | undefined }) => void;
  onSplitChange?: (args: { split: t.Percent[] }) => void;
};

/** Slot registry keys for TreeHost. */
export type TreeHostSlot = keyof TreeHostSlots;
/** Slot registry definitions for TreeHost. */
export type TreeHostSlots = {
  tree?: t.ReactNode;
  main?: t.ReactNode;
  aux?: t.ReactNode;
  empty?: (slot: TreeHostSlot) => t.ReactNode;
};
