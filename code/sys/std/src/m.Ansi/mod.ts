/**
 * @module
 * ANSI color formatting tools for terminal output.
 */
import type { t } from './common.ts';
export { stripAnsi } from './common.ts';

/** Standard ANSI colors. */
import * as ansi from './u.stdlib.ts';

/** Standard ANSI colors. */
export const colors = ansi as unknown as t.AnsiColors;
/** Short alias for the standard ANSI color map. */
export const c = colors;
