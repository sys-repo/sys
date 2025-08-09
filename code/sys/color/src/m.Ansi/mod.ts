/**
 * ANSI Color formatting tools for the terminal.
 * @module
 */
import type { AnsiColorLib } from './t.ts';

import { c, stripAnsi } from '@sys/std/ansi/server';
import { Color as rgb } from '../m.Rgb/mod.ts';

export { c, stripAnsi };

/**
 * CLI color formatting tools.
 */
export const Color: AnsiColorLib = {
  ansi: c,
  rgb,
};
