import type { t } from './common.ts';

/** Type re-exports. */
export type * from './t.node.ts';

/**
 * Split layout with main tree navigation.
 * UI contract is re-exported from `@sys/ui-react-components/TreeHost`.
 * Local extension keeps slug-aware Data helpers.
 */
export type TreeHostLib = {
  readonly UI: t.TreeHost.Lib['UI'];
  readonly Data: TreeHostDataLib;
};

export type TreeHostDataLib = t.TreeDataLib & { readonly Client: t.SlugClientLib };

/**
 * Component surface (upstream).
 */
export type TreeHostProps = t.TreeHost.Props;

/** Slot registry definitions for TreeHost. */
export type TreeHostSlots = t.TreeHost.Slots;

/** Slot registry keys for TreeHost. */
export type TreeHostSlot = t.TreeHost.Slot;
/** Slot input (node or render handler) for standard TreeHost slots. */
export type TreeHostSlotInput = t.TreeHost.SlotInput;

/**
 * Event handlers:
 */
export type TreeHostPathChangeHandler = t.TreeHost.PathChangeHandler;
export type TreeHostNodeSelectHandler = t.TreeHost.NodeSelectHandler;

/**
 * Event payloads:
 */
export type TreeHostPathChange = t.TreeHost.PathChange;
export type TreeHostNodeSelect = t.TreeHost.NodeSelect;
export type TreeHostNavLeafRenderer = t.TreeHost.NavLeafRenderer;
export type TreeHostNavLeafRenderArgs = t.TreeHost.NavLeafRenderArgs;
