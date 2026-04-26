/**
 * @module
 * ANSI Color formatting tools for the terminal.
 */
import type { AnsiColor, AnsiColorLib } from './t.ts';

import { c, stripAnsi } from '@sys/std/ansi/server';
import { Color as rgb } from '../m.Rgb/mod.ts';

export { c, stripAnsi };

const foreground: AnsiColor.Foreground = {
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
};

/**
 * CLI color formatting tools.
 */
export const Color: AnsiColorLib = {
  ansi: c,
  foreground,
  rgb,
};
