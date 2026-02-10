import type { t } from './common.ts';

export type TreeHostSpinner = TreeHostSpinnerSlot | TreeHostSlotSpinner;

/** Slot registry definitions for TreeHost. */
export type TreeHostSlots = {
  tree?: t.ReactNode;
  treeLeaf?: TreeHostTreeLeafRenderer;
  main?: t.ReactNode;
  aux?: t.ReactNode;
  empty?: (slot: TreeHostSlot) => t.ReactNode;
};

/** Slot registry keys for TreeHost. */
export type TreeHostSlot = keyof TreeHostSlots;
export type TreeHostSpinnerSlot = Exclude<TreeHostSlot, 'empty'>;
export type TreeHostSpinnerPosition = 'top' | 'middle' | 'bottom';
export type TreeHostSlotSpinner = {
  readonly slot: TreeHostSpinnerSlot;
  readonly backgroundOpacity?: number;
  readonly backgroundBlur?: t.Pixels;
  readonly position?: TreeHostSpinnerPosition;
};

/**
 * Leaf renderer
 */
export type TreeHostTreeLeafRenderer = (e: TreeHostTreeLeafRenderArgs) => t.ReactNode;
export type TreeHostTreeLeafRenderArgs = {
  readonly tree: t.TreeHostViewNodeList;
  readonly path: t.ObjectPath;
  readonly node: t.TreeHostViewNode;
};
