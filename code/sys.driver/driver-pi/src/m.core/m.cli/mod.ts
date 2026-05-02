/**
 * @module
 * CLI entrypoint for the typed Pi Deno boundary.
 */
import { type t } from './common.ts';
import { main as cli } from './m.main.ts';
import { run } from './m.run.ts';
import { main } from './-entry.ts';
import { Profiles } from '../m.cli.profiles/mod.ts';

/**
 * API surface:
 */
export { main, Profiles };
/** CLI launcher for running Pi behind the typed Deno boundary. */
export const Cli: t.PiCli.Lib = { main: cli, run };

/**
 * CLI entry-point:
 */
if (import.meta.main) {
  await main();
}
