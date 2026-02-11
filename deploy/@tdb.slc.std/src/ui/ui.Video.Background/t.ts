import type { t } from './common.ts';

/**
 * <Component>:
 */
export type VideoBackgroundProps = {
  video?: number | string;
  playing?: boolean;
  opacity?: number;
  blur?: number;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};
