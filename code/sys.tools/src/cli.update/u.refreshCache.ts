import { type t, Process } from './common.ts';

/**
 * Refresh the local JSR cache for @sys/tools.
 */
export async function refreshCache(cwd: t.StringDir, opts: { silent?: boolean } = {}) {
  const { silent = false } = opts;

  return await Process.invoke({
    cmd: 'deno',
    args: ['cache', '--reload', 'jsr:@sys/tools'],
    cwd,
    silent,
  });
}
