/**
 * @module
 * Pass-through CLI entry for launching `@sys/tmpl`
 * via the `@sys/tools/tmpl` published surface.
 */
import { Fs, type t } from '../common.ts';
import { runWithRootUpgradeAdvisory } from '../u.root/u.upgradeAdvisory.ts';
import { cliTmplWith } from './u.run.ts';

/**
 * CLI pass-through for the published template launcher surface.
 *
 * Delegates all argv/cwd handling to `@sys/tmpl`.
 */
export const cli: t.TmplToolsLib['cli'] = (cwd, argv) => cliTmplWith(cwd, argv);

if (import.meta.main) {
  await runWithRootUpgradeAdvisory(() => cli(Fs.cwd('terminal'), Deno.args));
}
