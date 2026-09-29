/**
 * @module
 * Serve CLI tools for ordinary static files, not pinned Dist hosting.
 * Displayed Dist metadata does not authenticate served bytes; size and build time are descriptive.
 */
import { Fs, type t } from './common.ts';
import { cli } from './m.cli.ts';
import { start } from './u.start.ts';
import { runWithRootUpgradeAdvisory } from '../u.root/u.upgradeAdvisory.ts';
export { cli };
export type * from './t.ts';

/** Public Serve helper API. */
export const Serve: t.ServeTool.Lib = { start };

/**
 * CLI entry-point:
 */
if (import.meta.main) {
  await runWithRootUpgradeAdvisory(() => cli(Fs.cwd('terminal'), Deno.args));
}
