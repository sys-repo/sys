import type { t } from './common.ts';

/**
 * <Component>:
 */
export type BulletProps = {
  selected?: boolean;

  // Appearance:
  size?: t.Pixels;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};
