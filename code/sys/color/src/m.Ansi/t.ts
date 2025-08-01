import type { t } from './common.ts';

/**
 * CLI color formatting tools.
 */
export type AnsiColorLib = {
  readonly ansi: t.AnsiColors;
  readonly rgb: t.ColorLib;
};
