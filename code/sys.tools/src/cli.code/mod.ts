/**
 * @module
 * Thin `@sys/tools/code` wrapper.
 *
 * Delegates execution directly to `@sys/driver-agent/pi/cli`.
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
