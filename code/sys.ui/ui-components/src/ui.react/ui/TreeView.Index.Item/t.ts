import type { t } from './common.ts';
import type { Presets } from './u.presets.ts';

/**
 * Library.
 */
export type IndexTreeViewItemLib = {
  readonly UI: t.FC<IndexTreeViewItemProps>;
  readonly Presets: IndexTreeViewPreset;
};

/** Preset padding values for index tree-view items. */
export type IndexTreeViewPreset = {
  readonly Padding: {
    readonly spacious: t.CssEdges.Quad;
    readonly default: t.CssEdges.Quad;
    readonly compact: t.CssEdges.Quad;
    readonly tight: t.CssEdges.Quad;
  };
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
  padding?: t.CssEdges.Padding.Input;
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
