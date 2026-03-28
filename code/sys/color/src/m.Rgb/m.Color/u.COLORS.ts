import type { t } from '../common.ts';

export const RUBY = `rgba(255, 0, 0, 0.1)`; // Debugger "ruby" RED color (semi-transparent).

export const BLACK = '#000';
export const WHITE = '#ffffff';
export const DARK = '#293042'; // Inky blue/black.
export const CYAN = '#00c2ff';
export const MAGENTA = '#fd508d';
export const BLUE = '#4d7ef7';
export const LIGHT_BLUE = '#00b5fb';
export const GREEN = '#00bb47';
export const YELLOW = '#fcc400';
export const LIME = '#a6e130';
export const PURPLE = '#a11d8e';
export const RED = '#e21b22';
export const TRANSPARENT = '#00000000';

/** Canonical color constant map. */
export const COLORS: t.ColorConstants = {
  TRANSPARENT,
  BLACK,
  WHITE,
  DARK,
  CYAN,
  MAGENTA,
  BLUE,
  LIGHT_BLUE,
  GREEN,
  YELLOW,
  LIME,
  PURPLE,
  RED,
  RUBY,
};
