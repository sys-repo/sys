import type { t } from './common.ts';

/**
 * <Component>:
 */
export type PlaylistProps = {
  debug?: boolean;
  items?: t.VideoMediaContent[];

  // Appearance.
  gap?: t.Pixels;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};
