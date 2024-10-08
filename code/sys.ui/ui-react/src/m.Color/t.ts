import type { t } from '../common.ts';

type HexColor = string;

/**
 * Represents a theme that produces basic color sets.
 */
export type ColorTheme = ColorThemeColors & {
  readonly name: t.CommonTheme;
  readonly is: { readonly light: boolean; readonly dark: boolean };
  alpha(percent?: t.Percent): ColorThemeColors;
  invert(): ColorTheme;
};

export type ColorThemeColors = {
  readonly bg: HexColor;
  readonly fg: HexColor;
};
