import type { t } from './common.ts';

/**
 * Index Tree library API:
 */
export type IndexTreeLib = {
  /** <IndexTree> component view: */
  View: React.FC<t.IndexTreeProps>;
  /** Individual item/node tools: */
  Item: { View: React.FC<t.IndexTreeItemProps> };
  /** Data utilities: */
  Data: t.IndexTreeDataLib;
};

/**
 * Component:
 */
export type IndexTreeProps = {
  root?: t.TreeNode | t.TreeNodeList;
  path?: t.ObjectPath;

  /** Slide/fade animation duration in milliseconds. */
  slideDuration?: t.Msecs;
  /** Horizontal slide offset in pixels applied during the fade. */
  slideOffset?: t.Pixels;

  // Appearance:
  minWidth?: t.Pixels;
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;

  // Handlers:
  onPointer?: t.IndexTreePointerHandler;
  onPressDown?: t.IndexTreePointerHandler;
  onPressUp?: t.IndexTreePointerHandler;
};

/**
 * Event: Pointer event with tree/node extended properties.
 */
export type IndexTreePointerHandler = (e: IndexTreePointer) => void;
export type IndexTreePointer = t.PointerEventsArg &
  Readonly<{
    node: t.TreeNode;
    hasChildren: boolean;
  }>;
