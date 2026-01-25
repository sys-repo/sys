import type { t } from './common.ts';

/** Component: */
export type IndexTreeViewItemProps = {
  label?: t.ReactNode;
  description?: t.ReactNode;

  enabled?: boolean;
  active?: boolean;
  selected?: boolean;

  // Appearance
  padding?: t.CssPaddingInput;
  chevron?: boolean | t.JSXElement;
  depth?: number;

  // Standard:
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;

  // Handlers:
  onPointer?: t.PointerEventsHandler;
  onPressDown?: t.PointerEventsHandler;
  onPressUp?: t.PointerEventsHandler;
};
