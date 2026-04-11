import { type t, Fs } from './common.ts';
import { PullFs } from './u.yaml/mod.ts';

export async function resolveNonInteractive(
  cwd: t.StringDir,
  args: t.PullTool.CliParsedArgs,
): Promise<{
  readonly yamlPath: t.StringPath;
  readonly location: t.PullTool.ConfigYaml.Location;
}> {
  const hasConfig = typeof args.config === 'string' && args.config.trim().length > 0;
  if (!hasConfig) {
    throw new Error('Missing required flag: --config (required with --no-interactive).');
  }

  const yamlPath = Fs.resolve(cwd, args.config!) as t.StringPath;
  const loaded = await PullFs.loadLocation(yamlPath);
  if (!loaded.ok) {
    throw new Error(`Could not load pull config: ${Fs.trimCwd(yamlPath)}`);
  }

  return {
    yamlPath,
    location: loaded.location,
  };
}
