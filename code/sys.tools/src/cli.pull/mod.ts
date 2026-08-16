/**
 * @module
 * Configure and execute Pull-owned remote materialization.
 *
 * Dist bundles authenticate an exact caller-supplied manifest pin and retain evidence on the
 * sealed generation. Sealing is point-in-time mode-bit evidence, not an OS security boundary. An
 * optional projection is a mutable copy and carries no verification claim. GitHub bundles remain
 * bounded downloads, not verified Dist materialization.
 */
import { Fs, type t } from './common.ts';
import { cli } from './m.cli.ts';
import { GithubPull } from './u.github/u.pull.ts';
import { resolve } from './u.resolve.ts';
import { run } from './u.run.ts';
import { runWithRootUpgradeAdvisory } from '../u.root/u.upgradeAdvisory.ts';

export { cli, GithubPull };
export type * from './t.ts';

/**
 * Resolve and execute durable Pull configuration.
 */
export const Pull: t.PullTool.Lib = { resolve, run };

/**
 * CLI entry-point:
 */
if (import.meta.main) {
  await runWithRootUpgradeAdvisory(() => cli(Fs.cwd('terminal'), Deno.args));
}
