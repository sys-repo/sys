/**
 * @module
 * Pull CLI tools.
 */
import { Fs, type t } from './common.ts';
import { cli } from './m.cli.ts';
import { resolve } from './u.resolve.ts';
import { run } from './u.run.ts';
import { runWithRootUpgradeAdvisory } from '../u.root/u.upgradeAdvisory.ts';

export { cli };
export type * from './t.ts';

/** Public Pull helper API. */
export const Pull: t.PullTool.Lib = { resolve, run };

/**
 * CLI entry-point:
 */
if (import.meta.main) {
  await runWithRootUpgradeAdvisory(() => cli(Fs.cwd('terminal'), Deno.args));
}
