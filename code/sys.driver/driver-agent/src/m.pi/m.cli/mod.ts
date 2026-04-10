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
export { Profiles } from '../m.cli.profiles/mod.ts';
export const Cli: t.PiCli.Lib = { main, run };

/**
 * CLI entry-point:
 */
if (import.meta.main) {
  await Cli.main({
    argv: Deno.args,
    cwd: Fs.cwd('terminal'),
  });
}
