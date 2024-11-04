import type * as t from './t.ts';

export const COLORS: t.ColorConstants = {
  BLACK: '#000',
  WHITE: '#FFFFFF',

  DARK: '#293042', // Inky blue/black.
  CYAN: '#00C2FF',
  MAGENTA: '#FE0064',

  BLUE: '#4D7EF7',
  GREEN: '#00BB47',
  YELLOW: '#FCC400',

  LIME: '#A6E130',
  PURPLE: '#A11D8E',

  RED: '#E21B22',
} as const;

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
};
