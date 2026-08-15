/**
 * @module
 * Pass-through CLI entry for launching `@sys/driver-pi/cli`
 * via the `@sys/tools/pi` published surface.
 */
import { Fs, type t } from '../common.ts';
import { runWithRootUpgradeAdvisory } from '../u.root/u.upgradeAdvisory.ts';
import { cliPiWith } from './u.run.ts';

/**
 * CLI pass-through for the published Pi launcher surface.
 *
 * Delegates all argv/cwd handling to the Pi profile launcher.
 */
export const cli: t.PiToolsLib['cli'] = (cwd, argv) => cliPiWith(cwd, argv);

if (import.meta.main) {
  await runWithRootUpgradeAdvisory(() => cli(Fs.cwd('process'), Deno.args));
}
