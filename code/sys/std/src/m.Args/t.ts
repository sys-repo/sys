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
  parse<T extends O = O>(args: string[], options?: ParseArgsOptions): ParsedArgs<T>;

  // TEMP 🐷
  parse2: typeof parseArgs;
};

/**
 * Options parse do the `Args.parse` method.
 */
export type ParseArgsOptions = {
  string?: string | string[];
  boolean?: string | string[];
  alias?: { [key: string]: string | string[] };
  default?: { [key: string]: any };
  [key: string]: any;
};

/**
 * Parsed arguments.
 */
export type ParsedArgs<T extends O = O> = T & { _: string[] };
