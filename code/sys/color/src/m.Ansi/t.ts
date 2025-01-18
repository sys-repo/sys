import type { t } from './common.ts';

/**
 * CLI color formatting tools.
 */
export type FmtColorsLib = {
  c: AnsiColors;
};

/**
 * Wraps the given text in an [ANSI] color wrapper.
 */
export type WrapAnsiColor = (text: string) => string;

/**
 * Index of ANSI color-wrapping methods.
 */
export type AnsiColors = {
  bgBlack: WrapAnsiColor;
  bgBlue: WrapAnsiColor;
  bgBrightBlack: WrapAnsiColor;
  bgBrightBlue: WrapAnsiColor;
  bgBrightCyan: WrapAnsiColor;
  bgBrightGreen: WrapAnsiColor;
  bgBrightMagenta: WrapAnsiColor;
  bgBrightRed: WrapAnsiColor;
  bgBrightWhite: WrapAnsiColor;
  bgBrightYellow: WrapAnsiColor;
  bgCyan: WrapAnsiColor;
  bgGreen: WrapAnsiColor;
  bgMagenta: WrapAnsiColor;
  bgRed: WrapAnsiColor;
  bgWhite: WrapAnsiColor;
  bgYellow: WrapAnsiColor;
  black: WrapAnsiColor;
  blue: WrapAnsiColor;
  bold: WrapAnsiColor;
  brightBlack: WrapAnsiColor;
  brightBlue: WrapAnsiColor;
  brightCyan: WrapAnsiColor;
  brightGreen: WrapAnsiColor;
  brightMagenta: WrapAnsiColor;
  brightRed: WrapAnsiColor;
  brightWhite: WrapAnsiColor;
  brightYellow: WrapAnsiColor;
  cyan: WrapAnsiColor;
  dim: WrapAnsiColor;
  gray: WrapAnsiColor;
  green: WrapAnsiColor;
  hidden: WrapAnsiColor;
  inverse: WrapAnsiColor;
  italic: WrapAnsiColor;
  magenta: WrapAnsiColor;
  red: WrapAnsiColor;
  reset: WrapAnsiColor;
  strikethrough: WrapAnsiColor;
  stripAnsiCode: WrapAnsiColor;
  underline: WrapAnsiColor;
  white: WrapAnsiColor;
  yellow: WrapAnsiColor;
};
