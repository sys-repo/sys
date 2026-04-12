import { Fs, type t } from './common.ts';
import { EndpointsFs } from './u.endpoints/mod.ts';

export async function resolveNonInteractive(
  cwd: t.StringDir,
  args: t.DeployTool.CliParsedArgs,
): Promise<{
  readonly yamlPath: t.StringPath;
  readonly key: string;
  readonly action: t.DeployTool.Endpoint.RunAction;
}> {
  const config = String(args.config ?? '').trim();
  if (!config) {
    throw new Error('Missing required flag: --config (required with --no-interactive).');
  }

  const action = toRunAction(args.action);
  if (!action) {
    const arg = String(args.action ?? '').trim();
    if (arg) throw new Error(`Invalid --action: ${arg}. Expected one of: stage, push, stage+push.`);
    throw new Error('Missing required flag: --action (required with --no-interactive).');
  }

  const yamlPath = Fs.resolve(cwd, config) as t.StringPath;
  const check = await EndpointsFs.validateYaml(yamlPath);
  if (!check.ok) {
    throw new Error(`Could not load deploy config: ${Fs.trimCwd(yamlPath)}`);
  }

  return {
    yamlPath,
    key: labelFromPath(yamlPath),
    action,
  };
}

function toRunAction(input: unknown): t.DeployTool.Endpoint.RunAction | undefined {
  switch (String(input ?? '').trim()) {
    case 'stage':
      return 'stage';
    case 'push':
      return 'push';
    case 'stage+push':
      return 'stage-push';
    default:
      return undefined;
  }
}

function labelFromPath(path: t.StringPath): string {
  const base = Fs.basename(path);
  return base.endsWith(EndpointsFs.ext) ? base.slice(0, -EndpointsFs.ext.length) : base;
}
