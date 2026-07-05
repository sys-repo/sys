import { Process, type t } from './common.ts';

const PUBLIC_TOOLS_SPECIFIER = 'jsr:@sys/tools' as const;

type Invoke = typeof Process.invoke;
type RefreshCacheDeps = { readonly invoke?: Invoke };

/**
 * Refresh the public JSR cache for @sys/tools.
 */
export async function refreshCache(
  cwd: t.StringDir,
  opts: { silent?: boolean } = {},
  deps: RefreshCacheDeps = {},
) {
  const { silent = false } = opts;

  return await (deps.invoke ?? Process.invoke)({
    cmd: 'deno',
    args: ['cache', '--reload', '--no-config', '--no-lock', PUBLIC_TOOLS_SPECIFIER],
    cwd,
    silent,
  });
}
