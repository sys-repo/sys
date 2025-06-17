import type { t } from './common.ts';

/**
 * <Component>:
 */
export type CanvasLayoutProps = {
  debug?: boolean;

  // Appearance:
  theme?: t.CommonTheme;
  style?: t.CssInput;
  border?: t.CssProps['border'];
};
