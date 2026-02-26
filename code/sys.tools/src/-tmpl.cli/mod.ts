/**
 * @module
 * __NAME__ CLI tools.
 *
 * ## For Agents
 *
 * ### Template Clean-Away (after first real feature lands)
 * Once a generated tool has a real user-facing command/flow, perform a focused
 * "template clean-away" pass for the live CLI surface.
 *
 * Goal:
 * - remove scaffold-only menu options and dead command variants
 * - keep only template machinery still required for `u.tmpl` self-cloning/tests
 * - leave a truthful, minimal live CLI
 *
 * Clean away (items inherited from the template scaffold that are not referenced
 * by the tool's live CLI flow, ie. they've been edited):
 * - scaffold root menu options (for example clone-template demo actions)
 * - root command union members that only supported scaffold menu actions
 * - helper files that are no longer imported by the live CLI path
 * - local command-picker unions/casts created only to preserve scaffold flows
 *
 * Keep (if still used by embedded template machinery / tests):
 * - `u.tmpl/*` template clone/runtime support
 * - `[tmpl:variant.*]` anchor comments in files patched by `u.tmpl/u.variant.ts`
 * - YAML config seams if the generated tool still uses stateful template wiring
 *
 * Verification (end conditions):
 * 1. No dead imports in the live CLI entry (`m.cli.ts`)
 * 2. No unreachable menu branches in the live root menu loop
 * 3. Root command/menu type unions match the actual live menu options
 * 4. Any removed helper file is confirmed unreferenced (`rg`)
 * 5. `deno task test --trace-leaks ./src/<tool>`
 * 6. `deno task check` (module root)
 *
 * Scope rule:
 * - Do not remove template machinery that is still required by `u.tmpl` clone flow
 *   or template self-tests unless that is the explicit refactor being performed.
 */
import { Fs } from './common.ts';
import { cli } from './m.cli.ts';
export { cli };

/**
 * CLI entry-point:
 */
if (import.meta.main) {
  await cli(Fs.cwd('terminal'), Deno.args);
}
