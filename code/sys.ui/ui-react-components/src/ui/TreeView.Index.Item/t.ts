import type { t } from './common.ts';

/**
 * Library.
 */
export type IndexTreeViewItemLib = { readonly UI: t.FC<IndexTreeViewItemProps> };

/**
 * Component:
 */
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
  indentSize?: t.Pixels;

  // Standard:
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;

  // Handlers:
  onPointer?: t.PointerEventsHandler;
  onPressDown?: t.PointerEventsHandler;
  onPressUp?: t.PointerEventsHandler;
};
