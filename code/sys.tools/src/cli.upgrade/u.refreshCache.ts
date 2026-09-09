import { Process, type t } from './common.ts';

const PUBLIC_TOOLS_SPECIFIER = 'jsr:@sys/tools' as const;
const REFRESH_CACHE_ARGS = [
  'cache',
  '--reload',
  '--no-config',
  '--no-lock',
  PUBLIC_TOOLS_SPECIFIER,
] as const;

export const refreshCacheCommand = ['deno', ...REFRESH_CACHE_ARGS].join(' ');

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
    args: [...REFRESH_CACHE_ARGS],
    cwd,
    silent,
  });
}
