/**
 * CLI entry point to the core system tools (ESM/WASM/JSR).
 * @module
 *
 * @example
 * ```ts
 * import { Main } from '@sys/main/cmd';
 * ```
 */
import type { SysMainLib } from './t.ts';

import { pkg } from './common.ts';
import { Cmd } from './m.Cmd.ts';

export { Cmd };

/**
 * Standardised "<Main Entry>" system behaviors.
 */
export const Main: SysMainLib = {
  Cmd,
  pkg,
  entry: Cmd.main,
};
