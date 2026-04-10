/**
 * @module
 * Thin CLI transport surface for launching Pi.
 */
import { Fs, type t } from './common.ts';
import { main } from './m.main.ts';
import { run } from './m.run.ts';
import { Profiles } from '../m.cli.profiles/mod.ts';

/**
 * API surface:
 */
export { Profiles };
export const Cli: t.PiCli.Lib = { main, run };

/**
 * CLI entry-point:
 */
if (import.meta.main) {
  const cwd = Fs.cwd('terminal');
  if (Deno.args[0] === 'Profiles') {
    await Profiles.main({ argv: Deno.args.slice(1), cwd });
  } else {
    await Cli.main({ argv: Deno.args, cwd });
  }
}
