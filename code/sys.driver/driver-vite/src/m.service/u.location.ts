import { Path, type t } from './common.ts';

/** Resolve the owner config path from Cell lifecycle args. */
export function resolveConfigPath(args: t.ViteService.StartArgs): t.StringPath {
  return Path.resolve(args.cwd, args.paths.config);
}

/** Resolve absolute service locations from Cell lifecycle args and owner config. */
export function resolveLocation(
  args: t.ViteService.StartArgs,
  config: t.ViteService.Config,
): t.ViteService.Location {
  const cwd = Path.resolve(args.cwd);
  const dir = Path.resolve(cwd, config.dir ?? '.');

  return {
    ...(config.name ? { name: config.name } : {}),
    cwd,
    config: resolveConfigPath(args),
    dir,
    ...(config.port !== undefined ? { port: config.port } : {}),
  };
}
