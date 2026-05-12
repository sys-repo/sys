/**
 * @module
 * Serve CLI tools.
 */
import { Fs, type t } from './common.ts';
import { cli } from './m.cli.ts';
import { start } from './u.start.ts';
import { runWithRootUpdateAdvisory } from '../u.root/u.updateAdvisory.ts';
export { cli };
export type * from './t.ts';

/** Public Serve helper API. */
export const Serve: t.ServeTool.Lib = { start };

/**
 * CLI entry-point:
 */
if (import.meta.main) {
  await runWithRootUpdateAdvisory(() => cli(Fs.cwd('terminal'), Deno.args));
}
