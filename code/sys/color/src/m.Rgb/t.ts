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

  /** Retrieve an alpha-percent of the current theme colors. */
  alpha(percent?: t.Percent): ColorThemeColors;

  /** Retrieve a new theme inverted (eg. "Dark" → "Light") */
  invert(): ColorTheme;

  /** Convert to string. */
  toString(): string;
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
