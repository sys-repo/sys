import type { t } from './common.ts';

/**
 * <Component>:
 */
export type PanelProps = {
  text?: string;
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};
