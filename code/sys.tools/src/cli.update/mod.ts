/**
 * @module
 * CLI helpers for updating the locally installed
 * `@sys/tools` module itself (self:reflective).
 */
import { Fs } from './common.ts';
import { cli } from './m.cli.ts';
export { cli };

/**
 * Library:
 */
export { UpdateTools } from './m.Update.ts';

/**
 * CLI entry-point:
 */
if (import.meta.main) {
  await cli(Fs.cwd('terminal'), Deno.args);
}
