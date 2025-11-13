import { type t } from './common.ts';

/** Supported layout modes for the RectStack. */
export type RectStackMode = 'stack' | 'grid' | 'stream';

/**
 * Layout container for a list of same-ratio items, rendered in
 * one of several visual modes (stack, grid, or stream).
 */
export type RectStackProps = {
  /** Items to render. Each item should share the same aspect ratio. */
  items?: t.Ary<RectStackItem>;
  /** Visual layout mode: single-item stack, responsive grid, or streamed depth view. */
  mode?: RectStackMode;
  /** Index of the currently active item (used by stack and stream modes). */
  activeIndex?: t.Index;
  /** Minimum column width used when computing the responsive grid. */
  minColumnWidth?: number;
  /** Space between items in grid and stream modes (in px). */
  gap?: t.Pixels;
  /** Fixed aspect ratio applied to each item's frame (width / height). */
  aspectRatio?: t.Percent;

  // Appearance:
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * A single renderable element within the RectStack.
 */
export type RectStackItem = {
  /** Unique identifier for the item. */
  readonly id: t.StringId;
  /** Render function for the item's content. */
  render(): React.ReactNode;
};
