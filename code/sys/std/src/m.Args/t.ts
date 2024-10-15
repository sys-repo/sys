import type { parseArgs } from '@std/cli/parse-args';

type O = Record<string, any>;

/**
 * Tools for parsing and interpretting "arguments" (parameter strings).
 * @example
 *
 * ```ts
 * const args = Args.parse(Deno.args)
 * ```
 */
export type ArgsLib = {
  /**
   * Parse command line arguments.
   */
  parse: typeof parseArgs;
};

/**
 * Parsed arguments.
 */
export type ParsedArgs<T extends O = O> = T & { _: string[] };
