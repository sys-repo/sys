import type { t } from './common.ts';

/**
 * <Component>:
 */
export type CanvasLayoutProps = {
  // Debug:
  debug?: boolean;
  debugSize?: { style?: t.CssInput };

  // Appearance:
  theme?: t.CommonTheme;
  style?: t.CssInput;
  border?: t.CssProps['border'];
};
