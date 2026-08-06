import type { t } from './common.ts';
import { DistServer } from '../m.server.dist/mod.ts';
import { loadConfig, resolveConfigPath, resolveDir, snapshotServiceArgs } from './u/u.config.ts';

/** Start a checksum-pinned Dist host from Cell lifecycle args. */
export const start: t.DistService.Start = async (input) => {
  const args = snapshotServiceArgs(input, true);
  const configPath = resolveConfigPath(args);
  const config = await loadConfig(configPath);
  const dir = resolveDir(args.cwd, config.dir);

  return await DistServer.start({
    dir,
    integrity: config.integrity,
    limits: config.limits,
    ...(config.hostname === undefined ? {} : { hostname: config.hostname }),
    ...(config.port === undefined ? {} : { port: config.port }),
    ...(config.name === undefined ? {} : { name: config.name }),
    ...(args.silent === undefined ? {} : { silent: args.silent }),
    ...(args.until === undefined ? {} : { until: args.until }),
  });
};
