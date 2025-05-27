import type { t } from './common.ts';

/**
 * <Component>:
 */
export type MyComponentProps = {
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};
