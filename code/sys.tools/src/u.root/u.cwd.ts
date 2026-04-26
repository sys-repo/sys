import { type t } from './common.ts';

/**
 * Resolve the direct process cwd for the root CLI entrypoint.
 *
 * Do not trust ambient `INIT_CWD` here: some shells export it globally, which
 * can poison direct invocations after `cd`. Delegated child tools must receive
 * their cwd explicitly from the caller instead of relying on inherited env.
 */
export function terminalCwd(): t.StringDir {
  return Deno.cwd();
}
