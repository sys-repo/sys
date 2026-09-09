/**
 * @module
 * Explicit raw Pi CLI boundary.
 *
 * This surface intentionally bypasses profile YAML, profile context, and the
 * wrapper-owned default system prompt. Use it for upstream Pi debugging and
 * recovery paths; use `@sys/driver-pi/cli` for normal profile-driven runs.
 */
import { type t } from '../common.ts';
import { main as rawMain } from '../m.main.ts';
import { run as rawRun } from '../m.run.ts';

/**
 * Raw CLI entrypoint that parses wrapper flags and launches upstream Pi directly.
 */
export const main: t.PiCli.Lib['main'] = rawMain;

/**
 * Raw process runner for an already-resolved Pi cwd, sandbox, and argument set.
 */
export const run: t.PiCli.Lib['run'] = rawRun;

/** Raw launcher for running upstream Pi behind the typed Deno boundary. */
export const Raw: t.PiCli.Lib = { main, run };

/**
 * CLI entry-point:
 */
if (import.meta.main) {
  await main({ argv: Deno.args });
}
