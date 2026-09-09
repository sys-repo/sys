import type { t } from './common.ts';

/**
 * Component:
 */
export type LoadingProps = {
  fadeInDuration?: t.Msecs;
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};
