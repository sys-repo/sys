import type { t } from './common.ts';

type HexColor = string;
type ColorInput = string | null;

/**
 * Library: Helpers for working with colors.
 */
export type ColorLib = t.ColorConstants & {
  /**
   * Takes a value of various types and converts it into a color.
   */
  format(value?: string | number | boolean): string | undefined;

  /**
   * Converts a color to an alpha RGB value.
   * @param: alpha: 0..1
   */
  alpha(color: string, alpha: t.Percent): string;

  /**
   * Lightens the given color.
   * @param amount: 0..100
   */
  lighten(color: string, amount: number): string;

  /**
   * Darkens the given color.
   * @param amount: 0..100
   */
  darken(color: string, amount: number): string;

  /**
   * Create a color theme instance.
   */
  theme(
    input?: t.CommonTheme | t.ColorTheme | null, // NB: loose input.
    defaultLight?: ColorInput,
    defaultDark?: ColorInput,
  ): t.ColorTheme;
};

export type ColorConstants = {
  readonly RED: string;
  readonly WHITE: string;
  readonly BLACK: string;
  readonly DARK: string;
  readonly BLUE: string;
  readonly GREEN: string;
};

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
