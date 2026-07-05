/**
 * @module
 * Shell profile diagnostics and setup helpers.
 */
import { Fs } from './common.ts';
import { cli } from './m.cli.ts';
import { runWithRootUpgradeAdvisory } from '../u.root/u.upgradeAdvisory.ts';
/**
 * Run the shell profile diagnostics CLI.
 */
export { cli };

/**
 * Library:
 */
/** Shell profile inspection and setup helpers. */
export { ShellTools } from './m.ShellTools.ts';

/**
 * CLI entry-point:
 */
if (import.meta.main) {
  await runWithRootUpgradeAdvisory(() => cli(Fs.cwd('terminal'), Deno.args));
}
