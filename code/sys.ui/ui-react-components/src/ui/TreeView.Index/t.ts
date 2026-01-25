import type { t } from './common.ts';

/** Chevron visibility override for lazy child placeholders. */
export type IndexTreeViewChevronMode = 'auto' | 'always' | 'never';

export type IndexTreeViewLib = {
  /** `<IndexTreeView>` component view. */
  UI: React.FC<t.IndexTreeViewProps>;
  /** Individual item/node tools. */
  Item: { View: React.FC<t.IndexTreeViewItemProps> };
  /** Data utilities. */
  Data: t.IndexTreeViewDataLib;
};

export type IndexTreeViewProps = {
  root?: t.TreeViewNode | t.TreeViewNodeList;
  path?: t.ObjectPath;

  /** Slide/fade animation duration in milliseconds. */
  slideDuration?: t.Msecs;
  /** Horizontal slide offset in pixels applied during the fade. */
  slideOffset?: t.Pixels;
  /** Chevron visibility override for lazy child placeholders. */
  showChevron?: t.IndexTreeViewChevronMode;
  /** Pixels per indent level when rendering inline children. */
  indentSize?: t.Pixels;

  // Appearance:
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
