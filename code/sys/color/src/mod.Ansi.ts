/**
 * @module
 * ANSI Color formatting tools for the terminal.
 */
import { c, stripAnsi } from '@sys/std/ansi/server';
import { Color as rgb } from './m.Rgb/mod.ts';

import type { t } from './common.ts';
export { c, stripAnsi };

/**
 * CLI color formatting tools.
 */
export const Color: t.AnsiColorLib = {
  ansi: c,
  rgb,
};
