import type { t } from './common.ts';

/**
 * <Component>:
 */
export type MyComponentProps = {
  text?: string;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};
