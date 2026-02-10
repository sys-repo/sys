import type { t } from './common.ts';

/** Type re-exports. */
export type * from './t.node.ts';

/**
 * Split layout with main tree navigation.
 * UI contract is re-exported from `@sys/ui-react-components/TreeHost`.
 * Local extension keeps slug-aware Data helpers.
 */
export type TreeHostLib = {
  readonly UI: import('@sys/ui-react-components/t').TreeHostLib['UI'];
  readonly Data: TreeHostDataLib;
};

export type TreeHostDataLib = t.TreeDataLib & { readonly Client: t.SlugClientLib };

/**
 * Component surface (upstream).
 */
export type TreeHostProps = import('@sys/ui-react-components/t').TreeHostProps;

/** Slot registry definitions for TreeHost. */
export type TreeHostSlots = import('@sys/ui-react-components/t').TreeHostSlots;

/** Slot registry keys for TreeHost. */
export type TreeHostSlot = import('@sys/ui-react-components/t').TreeHostSlot;

/**
 * Event handlers:
 */
export type TreeHostPathChangeHandler = import('@sys/ui-react-components/t').TreeHostPathChangeHandler;
export type TreeHostNodeSelectHandler = import('@sys/ui-react-components/t').TreeHostNodeSelectHandler;

/**
 * Event payloads:
 */
export type TreeHostPathChange = import('@sys/ui-react-components/t').TreeHostPathChange;
export type TreeHostNodeSelect = import('@sys/ui-react-components/t').TreeHostNodeSelect;
export type TreeHostTreeLeafRenderer = import('@sys/ui-react-components/t').TreeHostTreeLeafRenderer;
export type TreeHostTreeLeafRenderArgs = import('@sys/ui-react-components/t').TreeHostTreeLeafRenderArgs;
