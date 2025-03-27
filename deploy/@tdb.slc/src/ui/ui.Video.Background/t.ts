import type { t } from './common.ts';

/**
 * <Component>:
 */
export type VideoBackgroundProps = {
  kind?: 'Tubes';
  opacity?: t.Percent;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};
