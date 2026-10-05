import { type t } from './common.ts';
import { loadConfig } from './u.config.ts';
import { resolveConfigPath, resolveLocation } from './u.location.ts';

/** Declare configured resources for the Vite dev service without starting it. */
export async function resources(
  args: t.Service.Resource.Args,
): Promise<readonly t.Service.Resource.Any[]> {
  const config = await loadConfig(resolveConfigPath(args));
  const location = resolveLocation(args, config);
  if (location.port === undefined) return [];

  return [{ kind: 'tcp-listener', host: 'localhost', port: location.port }];
}
