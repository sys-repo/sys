/**
 * @module
 */
import { pkg } from './pkg.ts';
import { printHelp } from './u.help.ts';

export { pkg };

/** Type library (barrel file). */
export type * as t from './types.ts';

/**
 * CLI entry-point:
 */
if (import.meta.main) {
  printHelp(Deno.args);
}
