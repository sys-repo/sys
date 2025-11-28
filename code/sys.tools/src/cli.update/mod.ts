/**
 * @module
 * CLI helpers for updating the locally installed
 * `@sys/tools` module itself (self:reflective).
 */
import { Fs } from './common.ts';

/**
 * Library:
 */
export { UpdateTools } from './m.Update.ts';

/**
 * CLI entry-point:
 */
if (import.meta.main) {
  const { cli } = await import('./u.cli.ts');
  await cli(Fs.cwd('terminal'), Deno.args);
}
