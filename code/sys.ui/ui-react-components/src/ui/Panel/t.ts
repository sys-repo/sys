import type { t } from './common.ts';

/**
 * A utility panel.
 */
export type PanelProps = {
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssValue;
};
