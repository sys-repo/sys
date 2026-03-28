import { info } from './u.info.ts';

/**
 * Internal owned local `deno` CLI boundary helpers for workspace graph collection.
 *
 * Keep these dumb and explicit:
 * - build native CLI invocations
 * - keep cwd and root entry inputs explicit
 * - avoid moving normalization or orchestration into the CLI layer
 *
 * Reference:
 * - `deno info` CLI docs: https://docs.deno.com/runtime/reference/cli/info/
 * - `--json` is unstable, so this boundary intentionally isolates drift
 */
export const GraphCli = {
  info,
} as const;
