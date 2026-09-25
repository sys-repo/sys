/**
 * @module
 * Endpoint staging and publication through the Deploy CLI and programmatic API.
 */
import { runWithRootUpgradeAdvisory } from '../u.root/u.upgradeAdvisory.ts';
import { Fs, type t } from './common.ts';
import { cli } from './m.cli.ts';
import { DeployError } from './u.error.ts';
import { push } from './u.push/mod.ts';
import { stage } from './u.stage.ts';

/**
 * Run the deploy CLI.
 */
export { cli };
export type * from './t.ts';

/**
 * Stage and publish configured endpoints; inspect captured push failures.
 */
export const Deploy: t.DeployTool.Lib = { push, stage, Error: DeployError };

/**
 * CLI entry-point:
 */
if (import.meta.main) {
  await runWithRootUpgradeAdvisory(() => cli(Fs.cwd('terminal'), Deno.args));
}
