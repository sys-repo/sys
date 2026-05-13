/**
 * @module
 * Deploy CLI tools.
 */
import { Fs, type t } from './common.ts';
import { cli } from './m.cli.ts';
import { push } from './u.push/mod.ts';
import { stage } from './u.stage.ts';
import { runWithRootUpdateAdvisory } from '../u.root/u.updateAdvisory.ts';
export { cli };
export type * from './t.ts';

/** Public Deploy helper API. */
export const Deploy: t.DeployTool.Lib = { push, stage };

/**
 * CLI entry-point:
 */
if (import.meta.main) {
  await runWithRootUpdateAdvisory(() => cli(Fs.cwd('terminal'), Deno.args));
}
