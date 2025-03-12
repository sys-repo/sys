import type { t } from './common.ts';

/**
 * A utility panel.
 */
export type PanelProps = {
  text?: string;
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssValue;
};
