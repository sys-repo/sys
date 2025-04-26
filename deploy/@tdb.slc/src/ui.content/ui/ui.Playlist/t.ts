import type { t } from './common.ts';

/**
 * <Component>:
 */
export type PlaylistProps = {
  debug?: boolean;
  items?: t.VideoMediaContent[];
  selected?: t.Index;
  filled?: t.Index[];

  // Appearance:
  paddingTop?: t.Pixels;
  gap?: t.Pixels;
  theme?: t.CommonTheme;
  style?: t.CssInput;

  // Events:
  onItemClick?: (e: { item: t.VideoMediaConten; index: t.Index }) => void;
};
