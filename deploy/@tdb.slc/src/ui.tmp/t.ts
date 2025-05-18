import type { t } from './common.ts';

/**
 * <Component>:
 */
export type MyMandelbrotProps = {
  running?: boolean;
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};
