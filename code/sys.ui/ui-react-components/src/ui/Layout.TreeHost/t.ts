import type { t } from './common.ts';

/** Type re-exports. */
export type * from './t.node.ts';
export type * from './t.slots.ts';

/**
 * Split layout with main tree navigation.
 */
export declare namespace TreeHost {
  /** Public TreeHost module surface. */
  export type Lib = {
    readonly UI: t.FC<Props>;
    readonly Data: DataLib;
  };

  /** Data helper surface delegated from `IndexTreeView.Data`. */
  export type DataLib = t.IndexTreeViewDataLib;

  /**
   * Component:
   */
  export type Props = {
    slots?: Slots;
    tree?: t.TreeHostViewNodeList;
    selectedPath?: t.ObjectPath;
    spinner?: Spinner | Spinner[];
    nav?: Nav;
    parts?: Parts;

    debug?: boolean;
    theme?: t.CommonTheme;
    style?: t.CssInput;

    /**
     * User intent: request a new selection path (e.g. clicked a branch node).
     * The parent is expected to set `selectedPath` in response.
     */
    onPathRequest?: PathChangeHandler;

    /**
     * Fires whenever the user presses a node (branch or leaf).
     * Provides the node and a leaf indicator.
     */
    onNodeSelect?: NodeSelectHandler;
  };

  /** Canonical slot target names exposed by TreeHost. */
  export type Slot = t.TreeHostSlot;
  /** Slot input (node or lazy render handler) for standard TreeHost slots. */
  export type SlotInput = t.TreeHostSlotInput;
  /** Slot registry definitions for TreeHost. */
  export type Slots = t.TreeHostSlots;
  /** Spinner input accepted by TreeHost. */
  export type Spinner = t.TreeHostSpinner;
  /** Slot registry keys for spinner targeting. */
  export type SpinnerSlot = t.TreeHostSpinnerSlot;
  /** Vertical placement options for overlay spinners in a slot. */
  export type SpinnerPosition = t.TreeHostSpinnerPosition;
  /** Configurable spinner descriptor for a specific TreeHost slot. */
  export type SlotSpinner = t.TreeHostSlotSpinner;
  /** Generic slot renderer args. */
  export type RenderSlotArgs = t.TreeHostRenderSlotArgs;
  /** Generic slot renderer callback. */
  export type RenderSlotHandler = t.TreeHostRenderSlotHandler;
  /** Empty renderer args. */
  export type RenderEmptyArgs = t.TreeHostRenderEmptyArgs;
  /** Empty renderer callback. */
  export type RenderEmptyHandler = t.TreeHostRenderEmptyHandler;
  /** Nav leaf renderer callback. */
  export type NavLeafRenderer = t.TreeHostNavLeafRenderer;
  /** Nav leaf renderer args. */
  export type NavLeafRenderArgs = t.TreeHostNavLeafRenderArgs;

  /** Navigation panel sizing and animation settings. */
  export type Nav = {
    readonly width?: t.Pixels;
    readonly animate?: NavAnimate;
  };

  /** Navigation transition options for path changes. */
  export type NavAnimate = {
    readonly duration?: t.Msecs;
    readonly ease?: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut';
  };

  /** Visual part overrides for TreeHost regions. */
  export type Parts = {
    header?: PartHeader;
    nav?: PartNav;
    main?: PartMain;
    footer?: PartFooter;
  };

  /** Style overrides for the header region. */
  export type PartHeader = {
    background?: PartBackground;
  };

  /** Style overrides for the navigation region. */
  export type PartNav = {
    background?: PartBackground;
  };

  /** Style overrides for the main content region. */
  export type PartMain = {
    background?: PartBackground;
  };

  /** Style overrides for the footer region. */
  export type PartFooter = {
    background?: PartBackground;
  };

  /** Background override input for host regions (toggle or theme-aware callback). */
  export type PartBackground = boolean | ((e: { theme: t.CommonTheme }) => t.StringHex);

  /**
   * Event handlers:
   */
  export type PathChangeHandler = (e: PathChange) => void;
  /** Handler invoked when a specific node is pressed by the user. */
  export type NodeSelectHandler = (e: NodeSelect) => void;

  /**
   * Event payloads:
   */
  export type PathChange = {
    readonly tree: t.TreeHostViewNodeList;
    readonly path: t.ObjectPath;
  };

  /** Payload for node selection interactions emitted by TreeHost. */
  export type NodeSelect = {
    readonly tree: t.TreeHostViewNodeList;
    readonly path: t.ObjectPath;
    readonly node: t.TreeHostViewNode;
    readonly is: { readonly leaf: boolean };
  };
}
