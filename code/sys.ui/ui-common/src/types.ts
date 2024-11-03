/**
 * @module
 * Module types.
 */
import type { t } from './common.ts';

export type { CommonTheme, Msecs } from '@sys/types/t';
export type { CssValue } from '@sys/ui-dom/t';

/**
 * Common color constants.
 */
export type ColorContants = {
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
