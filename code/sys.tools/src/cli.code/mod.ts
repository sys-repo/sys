/**
 * @module
 * Code agent profile launcher.
 *
 * Delegates execution to `@sys/driver-agent/pi/cli Profiles`.
 */
import { Fs } from './common.ts';
import { cli } from './m.cli.ts';
export { cli };

/**
 * CLI entry-point:
 */
if (import.meta.main) {
  await cli(Fs.cwd('process'), Deno.args);
}
