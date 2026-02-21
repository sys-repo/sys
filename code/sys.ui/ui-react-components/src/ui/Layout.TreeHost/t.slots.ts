import type { t } from './common.ts';

/** Spinner input accepted by TreeHost (named slot or fully configured spinner object). */
export type TreeHostSpinner = TreeHostSpinnerSlot | TreeHostSlotSpinner;
/** Canonical slot target names exposed by TreeHost. */
export type TreeHostSlot =
  | 'nav:tree'
  | 'nav:leaf'
  | 'nav:footer'
  | 'main:body'
  | 'empty';
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
  nav?: {
    tree?: TreeHostSlotInput;
    leaf?: TreeHostNavLeafRenderer;
    footer?: TreeHostSlotInput;
  };
  main?: {
    body?: TreeHostSlotInput;
  };
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
 * Nav leaf renderer.
 */
export type TreeHostNavLeafRenderer = (e: TreeHostNavLeafRenderArgs) => t.ReactNode;
/** Context passed to `nav.leaf` renderers. */
export type TreeHostNavLeafRenderArgs = {
  readonly tree: t.TreeHostViewNodeList;
  readonly path: t.ObjectPath;
  readonly node: t.TreeHostViewNode;
};
