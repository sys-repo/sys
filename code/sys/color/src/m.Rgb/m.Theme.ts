import type { ColorThemeLib } from './t.ts';

import { type t, Num } from './common.ts';
import { DARK, WHITE } from './u.const.ts';
import { alpha } from './u.format.ts';

type HexColor = string;
type ColorInput = string | null;
const defaultTheme: t.CommonTheme = 'Light';

/**
 * A color theme helper object.
 */
export function create(
  input?: t.CommonTheme | t.ColorTheme | null, // NB: loose input.
  defaultLight?: ColorInput,
  defaultDark?: ColorInput,
): t.ColorTheme {
  const create = (name: t.CommonTheme) => factory(name, defaultLight, defaultDark);
  if (!input || input === null) return create(defaultTheme);
  return typeof input === 'object' ? input : create(input);
}

/**
 * Factory
 */
function factory(
  name: t.CommonTheme,
  defaultLight?: ColorInput,
  defaultDark?: ColorInput,
): t.ColorTheme {
  const fg = wrangle.color(name, defaultLight, defaultDark);
  const bg = wrangle.color(invert(name), defaultLight, defaultDark);
  const theme: t.ColorTheme = {
    name,
    fg,
    bg,
    is: { light: name === 'Light', dark: name === 'Dark' },
    alpha(percent: t.Percent = 1) {
      percent = Num.clamp(-1, 1, percent);
      const invert = percent < 0;
      const convert = (color: string) => alpha(color, Math.abs(percent));

      let _fg: HexColor;
      let _bg: HexColor;
      return {
        get fg() {
          return _fg || (_fg = convert(invert ? bg : fg));
        },
        get bg() {
          return _bg || (_bg = convert(invert ? fg : bg));
        },
      };
    },
    format(input) {
      if (input == null || input === '') return theme.toColors();
      if (typeof input === 'string') return { fg: input, bg: input };
      if (typeof input === 'number') return theme.alpha(input);
      return theme.toColors();
    },
    invert: () => create(invert(name), defaultLight, defaultDark),
    toString: () => name,
    toColors: () => ({ fg, bg }),
  };
  return theme;
}

/**
 * Invert a color scheme.
 */
export function invert(theme: t.CommonTheme = defaultTheme): t.CommonTheme {
  return theme === 'Dark' ? 'Light' : 'Dark';
}

/**
 * API
 */
export const Theme: ColorThemeLib = {
  create,
  invert,
};

/**
 * Helpers
 */
const wrangle = {
  color(theme: t.CommonTheme = defaultTheme, defaultLight?: ColorInput, defaultDark?: ColorInput) {
    const light = defaultLight ?? DARK;
    const dark = defaultDark ?? WHITE;
    return theme === 'Dark' ? dark : light;
  },
} as const;
