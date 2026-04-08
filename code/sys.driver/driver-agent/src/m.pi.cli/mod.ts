/**
 * @module
 * Thin CLI transport surface for launching Pi.
 */
import type { t } from './common.ts';
import { run } from './m.run.ts';

/**
 * API surface:
 */
export const PiCli: t.PiCli.Lib = { run };

/**
 * Main entry:
 */
if (import.meta.main) {
  await PiCli.run({ args: Deno.args });
}
