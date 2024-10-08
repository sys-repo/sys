import type { t } from '../common.ts';
import { DARK, WHITE } from './u.const.ts';
import { alpha } from './u.format.ts';

type HexColor = string;
type ColorInput = string | null;
const defaultTheme: t.CommonTheme = 'Light';

/**
 * A color theme helper object.
 */
export function theme(
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
  const bg = wrangle.color(wrangle.invert(name), defaultLight, defaultDark);
  return {
    name,
    fg,
    bg,
    is: { light: name === 'Light', dark: name === 'Dark' },
    alpha(percent: t.Percent = 1) {
      let _fg: HexColor;
      let _bg: HexColor;
      return {
        get fg() {
          return _fg || (_fg = alpha(fg, percent));
        },
        get bg() {
          return _bg || (_bg = alpha(bg, percent));
        },
      };
    },
    invert: () => theme(wrangle.invert(name), defaultLight, defaultDark),
  } as const;
}

/**
 * Helpers
 */
const wrangle = {
  color(theme: t.CommonTheme = defaultTheme, defaultLight?: ColorInput, defaultDark?: ColorInput) {
    const light = defaultLight ?? DARK;
    const dark = defaultDark ?? WHITE;
    return theme === 'Dark' ? dark : light;
  },

  invert(theme: t.CommonTheme = defaultTheme): t.CommonTheme {
    return theme === 'Dark' ? 'Light' : 'Dark';
  },
} as const;
