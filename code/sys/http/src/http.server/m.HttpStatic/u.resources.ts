import { type t } from './common.ts';
import { loadConfig } from './u.config.doc.ts';

/** Declare configured resources for the static HTTP service without starting it. */
export async function resources(
  args: t.Service.Resource.Args,
): Promise<readonly t.Service.Resource.Any[]> {
  const config = await loadConfig(args.paths.config, 'HttpStatic.resources');
  if (config.port === 0) return [];

  return [{ kind: 'tcp-listener', host: config.hostname, port: config.port }];
}
