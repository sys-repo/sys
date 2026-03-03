/**
 * @module
 * Thin `@sys/tools/tmpl` wrapper.
 *
 * Delegates execution directly to `@sys/tmpl`.
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
