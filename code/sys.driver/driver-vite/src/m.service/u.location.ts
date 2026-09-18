import { Path, type t } from './common.ts';

type ConfigPathArgs = {
  readonly cwd: t.StringDir;
  readonly paths: { readonly config: t.StringPath };
};

/** Resolve the owner config path from Cell lifecycle args. */
export function resolveConfigPath(args: ConfigPathArgs): t.StringPath {
  return Path.resolve(args.cwd, args.paths.config);
}

/** Resolve absolute service locations from Cell lifecycle args and owner config. */
export function resolveLocation(
  args: ConfigPathArgs,
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
