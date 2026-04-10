/**
 * @module
 * System tools root entry.
 */
import { pkg } from './pkg.ts';
import { cli } from './u.root/m.cli.ts';
import { terminalCwd } from './u.root/u.cwd.ts';

export { pkg };

/**
 * CLI entry-point:
 */
if (import.meta.main) {
  await cli(terminalCwd(), Deno.args);
}
