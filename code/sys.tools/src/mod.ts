/**
 * @module
 * System tools root entry.
 */
import type { t } from './u.root/common.ts';
import { pkg } from './pkg.ts';
import { cli } from './u.root/m.cli.ts';

export { pkg };

/** Type library (barrel file). */
export type * as t from './types.ts';

function terminalCwd(): t.StringDir {
  return (Deno.env.get('INIT_CWD') ?? Deno.cwd()) as t.StringDir;
}

/**
 * CLI entry-point:
 */
if (import.meta.main) {
  await cli(terminalCwd(), Deno.args);
}
