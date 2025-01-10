import type { t } from '../common.ts';
import { parseArgs as parse } from '@std/cli/parse-args';

/**
 * Tools for parsing and interpreting "arguments" (parameter strings).
 */
export const Args: t.ArgsLib = {
  /**
   * Parse command line arguments.
   */
  parse,
};
