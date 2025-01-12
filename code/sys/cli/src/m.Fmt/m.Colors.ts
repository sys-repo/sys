import type { t } from './common.ts';
import * as c from './std-lib.colors.ts';

export {
  /** Standard ANSI colors. */
  c,
};

/**
 * CLI color formatting tools.
 */
export const Colors: t.FmtColorsLib = { c };
