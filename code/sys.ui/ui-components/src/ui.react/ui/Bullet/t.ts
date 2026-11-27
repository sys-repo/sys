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
  /** Foreground border alpha in every state (0..1); fill is unchanged. */
  borderOpacity?: t.Percent;
  theme?: t.CommonTheme;
  style?: t.Style.Input;
};
