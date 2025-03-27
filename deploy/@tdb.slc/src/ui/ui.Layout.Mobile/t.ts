import type { t } from './common.ts';

/**
 * <Component>:
 */
export type MobileLayoutProps = {
  ctx?: { dist?: t.DistPkg; stage?: t.Stage };
  theme?: t.CommonTheme;
  style?: t.CssInput;
};
