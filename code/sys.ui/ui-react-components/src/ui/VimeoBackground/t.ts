import type { t } from './common.ts';

/**
 * <Component>:
 */
export type VimeoBackgroundProps = {
  video?: number | t.StringVideoAddress;
  opacity?: number;
  blur?: number;
  opacityTransition?: number; // msecs
  theme?: t.CommonTheme;
  style?: t.CssInput;
};
