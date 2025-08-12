import type { t } from './common.ts';

/**
 * Component:
 */
export type IndexTreeProps = {
  root?: t.TreeNode | t.TreeNodeList;
  minWidth?: t.Pixels;
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;

  // Handlers:
  onPointer?: t.IndexTreePointerHandler;
  onPressDown?: t.IndexTreePointerHandler;
  onPressUp?: t.IndexTreePointerHandler;
};

export type IndexTreePointerHandler = (e: IndexTreePointer) => void;
export type IndexTreePointer = t.PointerEventsArg & Readonly<{ node: t.TreeNode }>;
