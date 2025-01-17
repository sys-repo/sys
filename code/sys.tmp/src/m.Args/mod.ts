/**
 * @module
 * Tools for parsing command line arguments.
 *
 * @example
 * ```ts
 * import { Args } from '@sys/std/args';
 * const argv = Args.parse(Deno.args);
 * ```
 */
import { type t } from './common.ts';
import { parseArgs } from './u.parseArgs.ts';

export { parseArgs };

export const Args: t.ArgsLib = {
  parse: parseArgs,
};
