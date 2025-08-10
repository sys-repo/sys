import type { t } from './common.ts';

/**
 * Component:
 */
export type IndexTreeItemProps = {
  label?: t.ReactNode;
  enabled?: boolean;
  active?: boolean;

  // Appearance:
  debug?: boolean;
  padding?: t.CssPaddingInput;
  theme?: t.CommonTheme;
  style?: t.CssInput;

  // Handlers:
  onPointer?: t.PointerEventsHandler;
  onPressDown?: t.PointerEventsHandler;
  onPressUp?: t.PointerEventsHandler;
};
