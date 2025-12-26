/**
 * @module
 * CLI helpers for performing common file-system tasks.
 */
import { Fs } from './common.ts';
import { cli } from './m.cli.ts';
export { cli };

/**
 * CLI entry-point:
 */
if (import.meta.main) {
  await cli(Fs.cwd('terminal'), Deno.args);
}
