import type { t } from '../common.ts';

type ColorInput = string | null;

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
  readonly bg: t.HexColor;

  /** Foreground color. */
  readonly fg: t.HexColor;
};
