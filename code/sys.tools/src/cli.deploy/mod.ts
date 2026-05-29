/**
 * @module
 * Deploy CLI tools.
 */
import { Fs, type t } from './common.ts';
import { cli } from './m.cli.ts';
import { push } from './u.push/mod.ts';
import { stage } from './u.stage.ts';
import { runWithRootUpgradeAdvisory } from '../u.root/u.upgradeAdvisory.ts';
export { cli };
export type * from './t.ts';

/** Public Deploy helper API. */
export const Deploy: t.DeployTool.Lib = { push, stage };

/**
 * CLI entry-point:
 */
if (import.meta.main) {
  await runWithRootUpgradeAdvisory(() => cli(Fs.cwd('terminal'), Deno.args));
}
