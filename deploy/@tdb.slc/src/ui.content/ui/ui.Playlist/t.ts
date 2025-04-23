import type { t } from './common.ts';

/**
 * <Component>:
 */
export type PlaylistProps = {
  items?: t.VideoMediaContent[];
  theme?: t.CommonTheme;
  style?: t.CssInput;
};
