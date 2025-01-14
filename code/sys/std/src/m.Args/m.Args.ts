import type { t } from '../common.ts';
import parseArgs from 'minimist';

/**
 * Tools for parsing and interpreting "arguments" (parameter strings).
 */
export const Args: t.ArgsLib = {
  /**
   * Parse command line arguments.
   */
  parse(argv) {
    return parseArgs(argv);
  },
};
