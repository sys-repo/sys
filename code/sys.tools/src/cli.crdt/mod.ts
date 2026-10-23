/**
 * @module
 * CLI tools for working with CRDT documents.
 */
import { Fs } from './common.ts';
import { cli } from './m.cli.ts';
import { runWithRootUpgradeAdvisory } from '../u.root/u.upgradeAdvisory.ts';
export { cli };

/**
 * CLI entry-point:
 */
if (import.meta.main) {
  await runWithRootUpgradeAdvisory(() => cli(Fs.cwd('terminal'), Deno.args));
}
