import { c, type t } from './common.ts';

/** Foreground ANSI formatter subset keyed by canonical color name. */
export const foreground: t.AnsiColor.Foreground = Object.freeze({
  black: c.black,
  red: c.red,
  green: c.green,
  yellow: c.yellow,
  blue: c.blue,
  magenta: c.magenta,
  cyan: c.cyan,
  white: c.white,
  gray: c.gray,
  brightBlack: c.brightBlack,
  brightRed: c.brightRed,
  brightGreen: c.brightGreen,
  brightYellow: c.brightYellow,
  brightBlue: c.brightBlue,
  brightMagenta: c.brightMagenta,
  brightCyan: c.brightCyan,
  brightWhite: c.brightWhite,
});
