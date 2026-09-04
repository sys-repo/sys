/**
 * @module
 * Cell operator CLI.
 */
import type { t } from './common.ts';
import { run } from './m.run/mod.ts';

/**
 * Cell operator CLI.
 */
export const CellCli: t.CellCli.Lib = Object.freeze({ run });

/**
 * Main entry:
 */
if (import.meta.main) {
  const res = await CellCli.run({ argv: Deno.args });
  if (res.kind === 'error' || res.kind === 'kill') Deno.exitCode = res.code;
}
