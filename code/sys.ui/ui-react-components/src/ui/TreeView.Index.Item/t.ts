import type { t } from './common.ts';
import type { Presets } from './u.presets.ts';

/**
 * Library.
 */
export type IndexTreeViewItemLib = {
  readonly UI: t.FC<IndexTreeViewItemProps>;
  readonly Presets: typeof Presets;
};

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
