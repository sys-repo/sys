/**
 * @module
 * Pull CLI tools.
 */
import { Fs, type t } from './common.ts';
import { cli } from './m.cli.ts';
import { resolve } from './u.resolve.ts';

export { cli };
export type * from './t.ts';

/** Public Pull helper API. */
export const Pull: t.PullTool.Lib = { resolve };

/**
 * CLI entry-point:
 */
if (import.meta.main) {
  await cli(Fs.cwd('terminal'), Deno.args);
}
