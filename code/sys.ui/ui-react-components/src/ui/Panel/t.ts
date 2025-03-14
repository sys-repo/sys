import type { t } from './common.ts';

/**
 * A content panel.
 */
export type PanelProps = {
  text?: string;
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};
