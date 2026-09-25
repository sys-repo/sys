import { D, type t } from './common.ts';
import { loadConfig } from './u/u.config.ts';
import { resolveConfigPath } from './u/u.config.resolve.ts';

/** Declare configured resources for the Files WebSocket service without starting it. */
export async function resources(
  args: t.Service.Resource.Args,
): Promise<readonly t.Service.Resource.Any[]> {
  const configPath = resolveConfigPath(args);
  const config = await loadConfig(configPath);
  if (config.port === undefined || config.port === 0) return [];

  return [{
    kind: 'tcp-listener',
    host: config.hostname ?? D.hostname,
    port: config.port,
  }];
}
