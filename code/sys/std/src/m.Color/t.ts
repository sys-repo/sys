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

/**
 * Common color primitives (hex string).
 */
export type ColorConstants = {
  readonly WHITE: HexColor;
  readonly BLACK: HexColor;
  readonly DARK: HexColor;
  readonly RED: HexColor;
  readonly GREEN: HexColor;
  readonly BLUE: HexColor;
};

/**
 * Represents a theme that produces basic color sets.
 */
export type ColorTheme = ColorThemeColors & {
  /* The name of the theme. */
  readonly name: t.CommonTheme;

  /* Flags */
  readonly is: {
    /* Theme is "Light" */
    readonly light: boolean;

    /* Theme is "Dark" */
    readonly dark: boolean;
  };

  /* Retrieve an alpha-percent of the current theme colors. */
  alpha(percent?: t.Percent): ColorThemeColors;

  /* Retrieve a new theme inverted (eg. "Dark" → "Light") */
  invert(): ColorTheme;
};

/**
 * Primitive theme colors.
 */
export type ColorThemeColors = {
  /* Background color. */
  readonly bg: HexColor;

  /* Foreground color. */
  readonly fg: HexColor;
};
