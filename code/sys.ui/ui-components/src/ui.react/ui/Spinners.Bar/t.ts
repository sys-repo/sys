import type { t } from './common.ts';

/**
 * <Component>:
 */
export type BarSpinnerProps = {
  width?: number;
  height?: number;
  transparentTrack?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};
