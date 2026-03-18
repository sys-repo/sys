import { type t, c, stripAnsi } from './common.ts';
import { loadDeployEnv, printDeployEnvGuidance, toDeployEnvNotes, type DeployEnv } from '../m.deploy/u.env.ts';
import { Fmt } from '../u.fmt.ts';

type ExternalDeployEnv = DeployEnv & { readonly app: string };

export function loadExternalDeployEnv(): ExternalDeployEnv | undefined {
  const deployEnv = loadDeployEnv();
  return deployEnv.app ? (deployEnv as ExternalDeployEnv) : undefined;
}

export function printExternalDeployEnvGuidance() {
  const deployEnv = loadDeployEnv();
  printDeployEnvGuidance({
    title: 'DENO DEPLOY ENVIRONMENT VARIABLES NOT FOUND',
    what: 'External Deno Deploy coverage needs an existing target app.',
    why: 'DENO_DEPLOY_APP was not found in the current process env or nearest upward .env files.',
    retry: 'deno task test:external',
    notes: toDeployEnvNotes({
      app: 'is required for this test lane.',
      token: deployEnv.token ? 'is present.' : 'is optional if already authenticated; recommended for headless use.',
      org: deployEnv.org ? 'is present.' : 'is optional when current CLI org context is enough.',
    }),
  });
}

export function requireDeployEnv(): ExternalDeployEnv {
  const deployEnv = loadExternalDeployEnv();
  if (deployEnv) return deployEnv;

  printExternalDeployEnvGuidance();
  throw new Error('Missing DENO_DEPLOY_APP for external Deno Deploy coverage. See guidance above.');
}

export function requireDeployConfig(): t.DenoDeploy.DeployConfig {
  const deployEnv = requireDeployEnv();
  return {
    app: deployEnv.app,
    ...(deployEnv.org ? { org: deployEnv.org } : {}),
    ...(deployEnv.token ? { token: deployEnv.token } : {}),
  };
}

export function printExternalDeployInfo() {
  const deployEnv = requireDeployEnv();
  for (const line of Fmt.info({
    title: 'Deno Deploy External (Test Config)',
    rows: [
      { label: 'App', value: deployEnv.app, color: 'white' },
      { label: 'Org', value: deployEnv.org ?? '(default cli context)', color: 'white' },
      { label: 'Token', value: '', valueParts: redactToken(deployEnv.token) },
    ],
  })) {
    console.info(line);
  }
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

function redactToken(token?: string) {
  if (!token) return [c.italic(c.gray('(default cli auth)'))] as const;

  const head = token.slice(0, 3);
  const tail = token.slice(-5);
  return [c.italic(c.gray(`${head}..${tail}`))] as const;
}
