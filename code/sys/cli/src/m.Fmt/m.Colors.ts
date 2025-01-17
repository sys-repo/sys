import type { t } from './common.ts';

/** Standard ANSI colors. */
import * as c from './std-lib.colors.ts';
export { c };

/**
 * CLI color formatting tools.
 */
export const Colors: t.FmtColorsLib = { c };
