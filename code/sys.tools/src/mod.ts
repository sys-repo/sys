/**
 * @module
 * System tools root entry.
 */
import { Fs } from './common.ts';
import { pkg } from './pkg.ts';
import { cli } from './u.root/mod.ts';

export { pkg };

/** Type library (barrel file). */
export type * as t from './types.ts';

/**
 * CLI entry-point:
 */
if (import.meta.main) {
  await cli(Fs.cwd('terminal'), Deno.args);
}
