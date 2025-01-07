/**
 * @module
 * CLI entry point to the core system tools (ESM/WASM/JSR).
 *
 * @example
 * ```ts
 * import { Main } from '@sys/main/cmd';
 * ```
 */

import { type t, pkg } from './common.ts';
import { Cmd } from './m.Cmd.ts';

export { Cmd };
export const Main: t.SysMainLib = {
  Cmd,
  pkg,
  entry: Cmd.main,
};
