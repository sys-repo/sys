import type { t } from './common.ts';

export type TreeHostSpinner = TreeHostSpinnerSlot | TreeHostSlotSpinner;
export type TreeHostSlot = 'tree' | 'treeLeaf' | 'main' | 'aux' | 'empty';
export type TreeHostRenderSlotArgs = { readonly slot: t.TreeHostSlot };
export type TreeHostRenderSlotHandler = (e: TreeHostRenderSlotArgs) => t.ReactNode;
export type TreeHostSlotInput = t.ReactNode | TreeHostRenderSlotHandler;
export type TreeHostRenderEmptyArgs = { readonly slot: t.TreeHostSlot };
export type TreeHostRenderEmptyHandler = (e: TreeHostRenderEmptyArgs) => t.ReactNode;

/** Slot registry definitions for TreeHost. */
export type TreeHostSlots = {
  tree?: TreeHostSlotInput;
  treeLeaf?: TreeHostTreeLeafRenderer;
  main?: TreeHostSlotInput;
  aux?: TreeHostSlotInput;
  empty?: TreeHostRenderEmptyHandler;
};

/** Slot registry keys for TreeHost. */
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
