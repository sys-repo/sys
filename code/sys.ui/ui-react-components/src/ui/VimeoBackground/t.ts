import type { t } from './common.ts';

/**
 * <Component>:
 */
export type VimeoBackgroundProps = {
  video?: number | t.StringVideoAddress;

  playing?: boolean;
  jumpTo?: t.Secs;

  opacity?: number;
  blur?: number;
  opacityTransition?: t.Msecs;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};
