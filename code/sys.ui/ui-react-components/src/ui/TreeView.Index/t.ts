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

export type IndexTreeViewLeafRenderer = (e: IndexTreeViewLeafRendererArgs) => t.ReactNode;
export type IndexTreeViewLeafRendererArgs = {
  readonly root: t.TreeViewNodeList;
  readonly path: t.ObjectPath;
  readonly node: t.TreeViewNode;
};

export type IndexTreeViewPointerHandler = (e: IndexTreeViewPointer) => void;
export type IndexTreeViewPointer = t.PointerEventsArg & {
  readonly node: t.TreeViewNode;
  readonly hasChildren: boolean;
};

export type IndexTreeViewNodeSelectHandler = (e: IndexTreeViewNodeSelect) => void;
export type IndexTreeViewNodeSelect = {
  readonly path: t.ObjectPath;
  readonly node: t.TreeViewNode;
  readonly is: { readonly leaf: boolean };
};
