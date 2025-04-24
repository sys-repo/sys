import type { t } from './common.ts';

/**
 * <Component>:
 */
export type PlaylistProps = {
  debug?: boolean;
  items?: t.VideoMediaContent[];
  selectedIndex?: t.Index;

  // Appearance.
  paddingTop?: t.Pixels;
  gap?: t.Pixels;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};
