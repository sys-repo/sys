import type { t } from './common.ts';

/** Chevron visibility override for lazy child placeholders. */
export type IndexTreeViewChevronMode = 'auto' | 'always' | 'never';

/**
 * Namespace:
 */
export type IndexTreeViewLib = {
  /** `<IndexTreeView>` component view. */
  readonly UI: React.FC<t.IndexTreeViewProps>;
  /** Individual item/node tools. */
  readonly Item: t.IndexTreeViewItemLib;
  /** Data utilities. */
  readonly Data: t.IndexTreeViewDataLib;
};

/**
 * Component:
 */
export type IndexTreeViewProps = {
  root?: t.TreeViewNode | t.TreeViewNodeList;
  path?: t.ObjectPath;
  renderLeaf?: IndexTreeViewLeafRenderer;

  /** Slide/fade animation duration in milliseconds. */
  slideDuration?: t.Msecs;
  /** Horizontal slide offset in pixels applied during the fade. */
  slideOffset?: t.Pixels;
  /** Chevron visibility override for lazy child placeholders. */
  showChevron?: t.IndexTreeViewChevronMode;
  /** Pixels per indent level when rendering inline children. */
  indentSize?: t.Pixels;

  // Appearance:
  spinning?: boolean;
  minWidth?: t.Pixels;
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;

  // Handlers:
  onPointer?: t.IndexTreeViewPointerHandler;
  onPressDown?: t.IndexTreeViewPointerHandler;
  onPressUp?: t.IndexTreeViewPointerHandler;
  onNodeSelect?: t.IndexTreeViewNodeSelectHandler;
};

/** Renderer callback for leaf nodes when no child branch is available. */
export type IndexTreeViewLeafRenderer = (e: IndexTreeViewLeafRendererArgs) => t.ReactNode;
/** Context passed to leaf renderers. */
export type IndexTreeViewLeafRendererArgs = {
  readonly root: t.TreeViewNodeList;
  readonly path: t.ObjectPath;
  readonly node: t.TreeViewNode;
};

/** Pointer handler signature for node pointer interactions. */
export type IndexTreeViewPointerHandler = (e: IndexTreeViewPointer) => void;
/** Pointer event payload enriched with node context. */
export type IndexTreeViewPointer = t.PointerEventsArg & {
  readonly node: t.TreeViewNode;
  readonly hasChildren: boolean;
};

/** Handler signature for node selection intent. */
export type IndexTreeViewNodeSelectHandler = (e: IndexTreeViewNodeSelect) => void;
/** Node selection payload with path and leaf-state metadata. */
export type IndexTreeViewNodeSelect = {
  readonly path: t.ObjectPath;
  readonly node: t.TreeViewNode;
  readonly is: { readonly leaf: boolean };
};
