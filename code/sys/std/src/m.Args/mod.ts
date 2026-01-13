/**
 * Tools for parsing command line arguments.
 * @module
 *
 * @example
 * ```ts
 * import { Args } from '@sys/std/args';
 * const argv = Args.parse(Deno.args);
 * ```
 */
import type { t } from './common.ts';
import { normalizeCommand } from './u.normalizeCommand.ts';
import { parseArgs } from './u.parse.ts';
import { toAliasLookup } from './u.toAliasLookup.ts';

export { parseArgs };

/**
 * Command-line argument parsing.
 */
export const Args: t.ArgsLib = {
  parse: parseArgs,
  normalizeCommand,
  toAliasLookup,
};
