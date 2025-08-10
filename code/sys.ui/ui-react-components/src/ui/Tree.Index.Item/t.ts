import type { t } from './common.ts';

/**
 * Component:
 */
export type IndexTreeItemProps = {
  label?: t.ReactNode;
  enabled?: boolean;
  active?: boolean;
  selected?: boolean;

  // Appearance
  padding?: t.CssPaddingInput;
  chevron?: boolean | t.JSXElement;

  // Standard:
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;

  // Handlers:
  onPointer?: t.PointerEventsHandler;
  onPressDown?: t.PointerEventsHandler;
  onPressUp?: t.PointerEventsHandler;
};
