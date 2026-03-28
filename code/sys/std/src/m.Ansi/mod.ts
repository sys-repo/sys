/**
 * @module
 * ANSI Color formatting tools for the terminal.
 */
import type { t } from './common.ts';
export { stripAnsi } from './common.ts';

/** Standard ANSI colors. */
import * as ansi from './u.stdlib.ts';

/** Standard ANSI colors. */
export const colors = ansi as unknown as t.AnsiColors;
export const c = colors;
