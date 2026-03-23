import type { t } from './common.ts';

/** Type re-exports. */
export type * from './m.Theme/t.ts';

export type HexColor = t.StringHex;
export type RgbColor = `rgb(${string})`;
export type RgbaColor = `rgba(${string})`;
export type AlphaColorInput = HexColor | RgbColor | RgbaColor;
type ColorInput = string | null;

export type StringRgb = string;
export type StringRgba = string;

/**
 * Library: Helpers for working with colors.
 */
export type ColorLib = t.ColorConstants & {
  /**
   * Converts a color to an alpha RGB value.
   * @param: alpha: 0..1
   */
  alpha(color: AlphaColorInput, alpha: t.Percent): RgbaColor;
  /** Returns an alpha percentage of red. */
  ruby(alpha?: t.Percent | boolean): RgbaColor;

  /**
   * Lightens the given color.
   * @param amount: 0..100
   */
  lighten(color: HexColor, amount: number): RgbColor;

  /**
   * Darkens the given color.
   * @param amount: 0..100
   */
  darken(color: HexColor, amount: number): RgbColor;

  /**
   * Convert the given color into a hex.
   */
  toHex(color: AlphaColorInput): t.StringHex | undefined;

  /**
   * Convert a number in the range [-1, 1] to transparent/black/white RGBA.
   */
  toGrayAlpha(value: number): RgbaColor;

  /** ColorThemeLib */
  readonly Theme: t.ColorThemeLib;
  /** Create a color theme instance. */
  theme: t.ColorThemeLib['create'];
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
