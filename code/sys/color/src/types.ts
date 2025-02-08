/**
 * @module
 * Module types.
 */
import type { t } from './common.ts';
export type * from './m.Rgb/t.ts';

/**
 * CLI color formatting tools.
 */
export type AnsiColorLib = {
  readonly ansi: t.AnsiColors;
  readonly rgb: t.ColorLib;
};
