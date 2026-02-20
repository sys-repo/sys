import type { t } from './common.ts';

/** Spinner input accepted by TreeHost (named slot or fully configured spinner object). */
export type TreeHostSpinner = TreeHostSpinnerSlot | TreeHostSlotSpinner;
/** Canonical render slot names exposed by TreeHost. */
export type TreeHostSlot = 'tree' | 'treeLeaf' | 'main' | 'aux' | 'empty';
/** Arguments passed to generic slot render handlers. */
export type TreeHostRenderSlotArgs = { readonly slot: t.TreeHostSlot };
/** Render handler shape for standard TreeHost slots. */
export type TreeHostRenderSlotHandler = (e: TreeHostRenderSlotArgs) => t.ReactNode;
/** Slot input can be static content or a lazy render callback. */
export type TreeHostSlotInput = t.ReactNode | TreeHostRenderSlotHandler;
/** Arguments passed to the empty-state renderer. */
export type TreeHostRenderEmptyArgs = { readonly slot: t.TreeHostSlot };
/** Render handler shape for the empty slot fallback. */
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
/** Vertical placement options for overlay spinners in a slot. */
export type TreeHostSpinnerPosition = 'top' | 'middle' | 'bottom';
/** Configurable spinner descriptor for a specific TreeHost slot. */
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
/** Context passed to `treeLeaf` renderers. */
export type TreeHostTreeLeafRenderArgs = {
  readonly tree: t.TreeHostViewNodeList;
  readonly path: t.ObjectPath;
  readonly node: t.TreeHostViewNode;
};
