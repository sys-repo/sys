import type { t } from '../common.ts';
import { loadConfig, resolveConfigPath, resolveDir, snapshotServiceArgs } from '../u.config/u.ts';

const NONE: readonly t.Service.Resource.Any[] = Object.freeze([]);

/** Declare one configured fixed listener without starting the service. */
export const resources: t.DistService.Resources = async (input) => {
  const args = snapshotServiceArgs(input, false);
  const config = await loadConfig(resolveConfigPath(args));
  resolveDir(args.cwd, config.dir);
  if (config.port === undefined || config.port === 0) return NONE;

  return Object.freeze([
    Object.freeze({
      kind: 'tcp-listener' as const,
      host: config.hostname ?? '127.0.0.1',
      port: config.port,
    }),
  ]);
};
