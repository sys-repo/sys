/**
 * @module
 * Explicit raw Pi CLI boundary.
 *
 * This surface intentionally bypasses profile YAML, profile context, and the
 * wrapper-owned default system prompt. Use it for upstream Pi debugging and
 * recovery paths; use `@sys/driver-pi/cli` for normal profile-driven runs.
 */
import { type t } from '../m.cli/common.ts';
import { main } from '../m.cli/m.main.ts';
import { run } from '../m.cli/m.run.ts';

/** Raw launcher for running upstream Pi behind the typed Deno boundary. */
export const Raw: t.PiCli.Lib = { main, run };

/** Explicit raw entrypoint aliases. */
export { main, run };

/**
 * CLI entry-point:
 */
if (import.meta.main) {
  await main({ argv: Deno.args });
}
