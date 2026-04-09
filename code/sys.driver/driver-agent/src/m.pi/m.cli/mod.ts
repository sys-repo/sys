/**
 * @module
 * Thin CLI transport surface for launching Pi.
 */
import type { t } from './common.ts';
import { main } from './m.main.ts';
import { run } from './m.run.ts';

/**
 * API surface:
 */
export const PiCli: t.PiCli.Lib = { main, run };
