/**
 * @module
 * Cell operator CLI.
 */
import { CellCli } from './m.CellCli.ts';

export { CellCli };

/**
 * Main entry:
 */
if (import.meta.main) {
  const res = await CellCli.run({ argv: Deno.args });
  if (res.kind === 'error') Deno.exitCode = res.code;
}
