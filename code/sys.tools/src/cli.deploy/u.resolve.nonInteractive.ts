import { Fs, Is, type t } from './common.ts';
import { EndpointsFs } from './u.endpoints/mod.ts';
import { Fmt } from './u.fmt.ts';

export async function resolveNonInteractive(
  cwd: t.StringDir,
  args: t.DeployTool.CliParsedArgs,
): Promise<{
  readonly yamlPath: t.StringPath;
  readonly key: string;
  readonly action: t.DeployTool.Endpoint.RunAction;
  readonly force: boolean;
}> {
  const config = String(args.config ?? '').trim();
  if (!config) {
    throw new Error('Missing required flag: --config (required with --non-interactive).');
  }

  const action = toRunAction(args.action);
  if (!action) {
    const arg = String(args.action ?? '').trim();
    if (arg) throw new Error(`Invalid --action: ${arg}. Expected one of: stage, push, stage+push.`);
    throw new Error('Missing required flag: --action (required with --non-interactive).');
  }

  const yamlPath = Fs.resolve(cwd, config) as t.StringPath;
  const check = await EndpointsFs.validateYaml(yamlPath, { cwd });
  if (!check.ok) {
    const details = errorMessagesOf(check) || Fmt.endpointValidation(check);
    const suffix = details ? `\n${details}` : '';
    throw new Error(`Could not load deploy config: ${Fs.trimCwd(yamlPath)}${suffix}`);
  }

  return {
    yamlPath,
    key: labelFromPath(yamlPath),
    action,
    force: args.force === true,
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

function errorMessagesOf(check: t.DeployTool.Endpoint.Fs.YamlCheck): string {
  if (check.ok) return '';

  return check.errors
    .map((error) => {
      const message = (error as { readonly message?: unknown }).message;
      return Is.str(message) ? message.trim() : '';
    })
    .filter((message) => message.length > 0)
    .join('\n');
}
