import { type t } from './common.ts';

/**
 * Layout container for a list of same-ratio items,
 * rendered within a flexible layout grid.
 */
export type RectGridProps = {
  items?: t.Ary<RectGridItem>;
  activeIndex?: t.Index;
  minColumnWidth?: t.Pixels;
  gap?: t.Pixels;
  aspectRatio?: number;

  // Appearance:
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * A single renderable element within the grid.
 */
export type RectGridItem = {
  readonly id: t.StringId;
  render(): React.ReactNode;
};
