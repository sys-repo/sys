import type { t } from './common.ts';

/**
 * <Component>:
 */
export type VimeoBackgroundProps = {
  video?: number | t.StringVideoAddress;
  playing?: boolean;
  opacity?: number;
  blur?: number;
  opacityTransition?: number; // msecs
  theme?: t.CommonTheme;
  style?: t.CssInput;
};
