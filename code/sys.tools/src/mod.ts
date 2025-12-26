/**
 * @module
 * System tools root entry.
 */
import { pkg } from './pkg.ts';
import { printRootHelp } from './u.root/mod.ts';

export { pkg };

/** Type library (barrel file). */
export type * as t from './types.ts';

/**
 * CLI entry-point:
 */
if (import.meta.main) {
  printRootHelp(Deno.args);
}
