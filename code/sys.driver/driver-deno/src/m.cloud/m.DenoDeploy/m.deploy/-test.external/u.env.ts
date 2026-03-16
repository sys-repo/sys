import { Env, stripAnsi } from './common.ts';
import { Fmt } from '../../u.fmt.ts';

export type DeployEnv = {
  readonly app: string;
  readonly org?: string;
  readonly token?: string;
};

const env = await Env.load({ search: 'upward' });
export function loadDeployEnv(): DeployEnv | undefined {
  const app = env.get('DENO_DEPLOY_APP').trim();
  const org = env.get('DENO_DEPLOY_ORG').trim();
  const token = env.get('DENO_DEPLOY_TOKEN').trim();

  if (app.length > 0) {
    return {
      app,
      ...(org.length > 0 ? { org } : {}),
      ...(token.length > 0 ? { token } : {}),
    };
  }

  return undefined;
}

export function printDeployEnvGuidance() {
  const org = env.get('DENO_DEPLOY_ORG').trim();
  const token = env.get('DENO_DEPLOY_TOKEN').trim();
  printLines(
    Fmt.envVarsNotFound({
      title: 'DENO DEPLOY ENVIRONMENT VARIABLES NOT FOUND',
      what: 'External Deno Deploy coverage needs an existing target app.',
      why: 'DENO_DEPLOY_APP was not found in the current process env or nearest upward .env files.',
      retry: 'deno task test:external',
      notes: toDeployEnvNotes({ org, token }),
    }),
  );
}

export function requireDeployEnv(): DeployEnv {
  const deployEnv = loadDeployEnv();
  if (deployEnv) return deployEnv;

  printDeployEnvGuidance();
  throw new Error('Missing DENO_DEPLOY_APP for external Deno Deploy coverage. See guidance above.');
}

export function toDeployFailure(input: {
  readonly code: number;
  readonly stdout: string;
  readonly stderr: string;
}) {
  const lines = [
    `DenoDeploy external deploy failed (code ${input.code}).`,
    '',
    'stdout:',
    input.stdout,
    '',
    'stderr:',
    input.stderr,
  ];
  return stripAnsi(lines.join('\n'));
}

function printLines(lines: readonly string[]) {
  for (const line of lines) console.info(line);
}

function toDeployEnvNotes(args: { readonly org: string; readonly token: string }) {
  return [
    note('DENO_DEPLOY_APP', 'is required for this test lane.'),
    note(
      'DENO_DEPLOY_TOKEN',
      args.token.length > 0 ? 'is present.' : 'is optional if already authenticated; recommended for headless use.',
    ),
    note(
      'DENO_DEPLOY_ORG',
      args.org.length > 0 ? 'is present.' : 'is optional when current CLI org context is enough.',
    ),
    note('DENO_DEPLOY_REGION', 'is shown for the future create flow.'),
  ] as const;
}

function note(key: string, detail: string) {
  return `  ${key.padEnd(20)} ${detail}`;
}
