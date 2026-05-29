/**
 * @module
 * CLI helpers for upgrading the locally installed
 * `@sys/tools` module itself (self:reflective).
 */
import { Fs } from './common.ts';
import { cli } from './m.cli.ts';
export { cli };

/**
 * Library:
 */
export { UpgradeTools } from './m.Upgrade.ts';

/**
 * CLI entry-point:
 */
if (import.meta.main) {
  await cli(Fs.cwd('terminal'), Deno.args);
}
