/**
 * @module
 * Thin CLI transport surface for launching Pi.
 */
import { Fs, type t } from './common.ts';
import { main } from './m.main.ts';
import { run } from './m.run.ts';

/**
 * API surface:
 */
export const PiCli: t.PiCli.Lib = { main, run };

/**
 * CLI entry-point:
 */
if (import.meta.main) {
  await PiCli.main({
    argv: Deno.args,
    cwd: Fs.cwd('terminal'),
  });
}
