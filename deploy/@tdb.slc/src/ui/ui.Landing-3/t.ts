import type { t } from './common.ts';

/**
 * <Component>:
 */
export type Landing3Props = {
  signals?: t.SlcSignals;
  debug?: boolean;
  backgroundVideoOpacity?: t.Percent;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};
