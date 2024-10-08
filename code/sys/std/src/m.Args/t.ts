import type { parseArgs } from '@std/cli/parse-args';

/**
 * Tools for parsing and interpretting "arguments" (parameter strings).
 */
export type ArgsLib = {
  /**
   * Take a set of command line arguments, optionally with a set of options,
   * and return an object representing the flags found in the passed arguments.
   */
  parse: typeof parseArgs;
};
