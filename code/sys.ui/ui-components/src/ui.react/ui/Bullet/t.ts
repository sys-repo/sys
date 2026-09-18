import type { t } from './common.ts';

/**
 * <Component>:
 */
export type BulletProps = {
  selected?: boolean;
  filled?: boolean;

  selectedColor?: t.StringHex;
  filledColor?: t.StringHex;
  colorTransition?: t.Msecs;

  // Appearance:
  size?: t.Pixels;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};
