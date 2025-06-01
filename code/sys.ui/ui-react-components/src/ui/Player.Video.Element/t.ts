import type { t } from './common.ts';

/**
 * <Component>:
 */
export type VideoElementProps = {
  debug?: boolean;

  // State:
  signals?: t.VideoPlayerSignals;

  // Appearance:
  theme?: t.CommonTheme;
  style?: t.CssInput;
};
