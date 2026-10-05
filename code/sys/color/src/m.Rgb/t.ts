import type { t } from './common.ts';

/** Type re-exports. */
export type * from './m.Theme/t.ts';

/**
 * Color type family.
 */
export declare namespace Color {
  /** Hex color string. */
  export type Hex = t.StringHex;

  /** CSS `rgb(...)` color string. */
  export type Rgb = `rgb(${string})`;

  /** CSS `rgba(...)` color string. */
  export type Rgba = `rgba(${string})`;

  /** Color inputs accepted by alpha-aware helpers. */
  export type AlphaInput = Hex | Rgb | Rgba;

  /** Tools for working with the basic color theme ("Light" / "Dark"). */
  export type ThemeLib = {
    /** Create a color theme instance. */
    create(
      input?: t.CommonTheme | Theme | null, // NB: loose input.
      defaultLight?: string | null,
      defaultDark?: string | null,
    ): Theme;

    /** Invert a color scheme. */
    invert(theme?: t.CommonTheme): t.CommonTheme;
  };

  /** Represents a theme that produces basic color sets. */
  export type Theme = ThemeColors & {
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
    invert(): Theme;

    /** Retrieve an alpha-percent (-1..1) of the current theme colors (pass negative to invert). */
    alpha(percent?: t.Percent): ThemeColors;

    /** Convert to string. */
    toString(): string;

    /** Convert to a fg/bg object. */
    toColors(): ThemeColors;
  };

  /** Primitive theme colors. */
  export type ThemeColors = {
    /** Background color. */
    readonly bg: Hex;

    /** Foreground color. */
    readonly fg: Hex;
  };

  /** Common color constants. */
  export type Constants = {
    /** Fully transparent color (0% opacity). */
    TRANSPARENT: Hex;
    /** The color black. */
    BLACK: Hex;
    /** The color white. */
    WHITE: Hex;
    /** Dark inky color. */
    DARK: Hex;
    /** The color cyan. */
    CYAN: Hex;
    /** The color magenta. */
    MAGENTA: Hex;
    /** The color blue. */
    BLUE: Hex;
    /** A lighter blue color. */
    LIGHT_BLUE: Hex;
    /** The color green. */
    GREEN: Hex;
    /** The color yellow. */
    YELLOW: Hex;
    /** The color lime green. */
    LIME: Hex;
    /** The color purple. */
    PURPLE: Hex;
    /** The color red. */
    RED: Hex;
    /** Debugger "ruby" RED color (semi-transparent). */
    RUBY: Rgba;
  };

  /** Library: Helpers for working with colors. */
  export type Lib = Constants & {
    /** Converts a color to an alpha RGB value. */
    alpha(color: AlphaInput, alpha: t.Percent): Rgba;

    /** Returns an alpha percentage of red. */
    ruby(alpha?: t.Percent | boolean): Rgba;

    /** Lightens the given color. */
    lighten(color: Hex, amount: number): Rgb;

    /** Darkens the given color. */
    darken(color: Hex, amount: number): Rgb;

    /** Convert the given color into a hex. */
    toHex(color: AlphaInput): Hex | undefined;

    /** Convert a number in the range [-1, 1] to transparent/black/white RGBA. */
    toGrayAlpha(value: number): Rgba;

    /** Color theme helpers. */
    readonly Theme: ThemeLib;

    /** Create a color theme instance. */
    theme: ThemeLib['create'];
  };
}
