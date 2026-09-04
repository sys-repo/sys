import { Files, Fs, type t } from './common.ts';
import { WebSocket } from '../m.server.files/m.WebSocket/mod.ts';
import { loadConfig, policyOf, resolveConfigPath, resolveRoot } from './u/u.config.ts';

/**
 * Start a Files-over-WebSocket service from Cell lifecycle args.
 */
export async function start(
  args: t.FilesWebSocketService.StartArgs,
): Promise<t.FilesServer.WebSocket.Started> {
  const configPath = resolveConfigPath(args);
  const config = await loadConfig(configPath);
  const root = resolveRoot(args.cwd, config.root, 'FilesWebSocketService.start');
  const files = filesOf({ root, config, policy: policyOf(config) });

  return WebSocket.create({
    ...(config.hostname === undefined ? {} : { hostname: config.hostname }),
    ...(config.port === undefined ? {} : { port: config.port }),
    path: config.path,
    files,
    ...(args.until === undefined ? {} : { until: args.until }),
    status: {
      ...(config.name === undefined ? {} : { name: config.name }),
      root,
      config: configPath,
    },
  });
}

/**
 * Helpers:
 */
function filesOf(args: {
  readonly root: t.StringDir;
  readonly config: t.FilesWebSocketService.Config;
  readonly policy: ReturnType<t.Files.Lib['Policy']['readonly']>;
}): t.FilesServer.Backing {
  const { config, policy, root } = args;
  if (config.watch) {
    return Files.Fs.Readonly.live({
      fs: Fs.Capability.Files.Readonly.live(Fs),
      root,
      policy,
    });
  }

  return Files.Fs.Readonly.create({
    fs: Fs.Capability.Files.Readonly.create(Fs),
    root,
    policy,
  });
}
