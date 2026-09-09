import { type t, Vite } from './common.ts';
import { loadConfig } from './u.config.ts';
import { handleOf } from './u.handle.ts';
import { resolveConfigPath, resolveLocation } from './u.location.ts';

/** Start a Vite dev server from Cell lifecycle args. */
export async function startDev(
  args: t.ViteService.StartArgs,
  deps: t.ViteService.StartDevDeps = {},
): Promise<t.ViteService.DevHandle> {
  const config = await loadConfig(resolveConfigPath(args));
  const location = resolveLocation(args, config);
  const server = await (deps.dev ?? Vite.dev)({
    cwd: location.dir,
    port: location.port,
    ...(location.port === undefined ? {} : { strictPort: true }),
    silent: args.silent ?? true,
    until: args.until,
  });
  return handleOf(location, server);
}
