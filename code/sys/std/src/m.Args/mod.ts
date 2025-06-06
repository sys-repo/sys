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
import type { ArgsLib } from './t.ts';
import { parseArgs } from './u.parseArgs.ts';

export { parseArgs };

export const Args: ArgsLib = {
  parse: parseArgs,
};
