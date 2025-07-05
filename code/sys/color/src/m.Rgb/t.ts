import type { t } from './common.ts';

type HexColor = string;
type ColorInput = string | null;

export type StringRgb = string;
export type StringRgba = string;

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
  alpha(color: string, alpha: t.Percent): t.StringRgba;
  /** Returns an alpha percentage of red. */
  ruby(alpha?: t.Percent | boolean): t.StringRgba;

  /**
   * Lightens the given color.
   * @param amount: 0..100
   */
  lighten(color: string, amount: number): t.StringRgb;

  /**
   * Darkens the given color.
   * @param amount: 0..100
   */
  darken(color: string, amount: number): t.StringRgb;

  /**
   * Convert the given color into a hex.
   */
  toHex(color: string): t.StringHex;

  /** ColorThemeLib */
  readonly Theme: ColorThemeLib;
  /** Create a color theme instance. */
  theme: ColorThemeLib['create'];
};

/**
 * Tools for working with the basic color theme ("Light" / "Dark").
 */
export type ColorThemeLib = {
  /**
   * Create a color theme instance.
   */
  create(
    input?: t.CommonTheme | t.ColorTheme | null, // NB: loose input.
    defaultLight?: ColorInput,
    defaultDark?: ColorInput,
  ): t.ColorTheme;

  /**
   * Invert a color scheme.
   */
  invert(theme?: t.CommonTheme): t.CommonTheme;
};

/**
 * Represents a theme that produces basic color sets.
 */
export type ColorTheme = ColorThemeColors & {
  /** The name of the theme. */
  readonly name: t.CommonTheme;

  /** Flags */
  readonly is: {
    /** Theme is "Light" */
    readonly light: boolean;
    /** Theme is "Dark" */
    readonly dark: boolean;
  };

  /** Retrieve a new theme inverted (eg. "Dark" → "Light") */
  invert(): ColorTheme;

  /** Retrieve an alpha-percent (-1..1) of the current theme colors (pass negative to invert). */
  alpha(percent?: t.Percent): ColorThemeColors;

  /** Retrieves an alpha-percent of the current theme, or locked to the given string-color if provided (pass negative to invert). */
  format(input?: t.Percent | string): ColorThemeColors;

  /** Convert to string. */
  toString(): string;
  /** Convert to a fg/bg object. */
  toColors(): ColorThemeColors;
};

/**
 * Primitive theme colors.
 */
export type ColorThemeColors = {
  /** Background color. */
  readonly bg: HexColor;

  /** Foreground color. */
  readonly fg: HexColor;
};

/**
 * Common color constants.
 */
export type ColorConstants = {
  /** Fully transparent color (0% opacity). */
  TRANSPARENT: t.StringHex;
  /** The color black. */
  BLACK: t.StringHex;
  /** The color white. */
  WHITE: t.StringHex;
  /** Dark inky color. */
  DARK: t.StringHex;
  /** The color cyan. */
  CYAN: t.StringHex;
  /** The color magenta. */
  MAGENTA: t.StringHex;
  /** The color blue. */
  BLUE: t.StringHex;
  /** A lighter blue color. */
  LIGHT_BLUE: t.StringHex;
  /** The color green. */
  GREEN: t.StringHex;
  /** The color yellow. */
  YELLOW: t.StringHex;
  /** The color lime green. */
  LIME: t.StringHex;
  /** The color purple. */
  PURPLE: t.StringHex;
  /** The color red. */
  RED: t.StringHex;
  /** Debugger "ruby" RED color (semi-transparent). */
  RUBY: t.StringHex;
};
