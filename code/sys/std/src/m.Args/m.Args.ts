import type { t } from '../common.ts';
import minimist from 'minimist';

type O = Record<string, any>;

/**
 * Tools for parsing and interpreting "arguments" (parameter strings).
 */
export const Args: t.ArgsLib = {
  /**
   * Parse command line arguments.
   */
  parse<T extends O = O>(args: string[], options: t.ParseArgsOptions = {}) {
    return minimist(args, options) as t.ParsedArgs<T>;
  },
};
