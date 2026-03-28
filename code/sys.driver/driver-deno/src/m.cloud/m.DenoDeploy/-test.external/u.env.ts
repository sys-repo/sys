import { stripAnsi } from './common.ts';
import { loadDeployEnv, printDeployEnvGuidance, toDeployEnvNotes, type DeployEnv } from '../m.deploy/u.env.ts';

type ExternalDeployEnv = DeployEnv & { readonly app: string };

export async function loadExternalDeployEnv(): Promise<ExternalDeployEnv | undefined> {
  const deployEnv = await loadDeployEnv();
  return deployEnv.app ? (deployEnv as ExternalDeployEnv) : undefined;
}

export async function printExternalDeployEnvGuidance() {
  const deployEnv = await loadDeployEnv();
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

export async function requireDeployEnv(): Promise<ExternalDeployEnv> {
  const deployEnv = await loadExternalDeployEnv();
  if (deployEnv) return deployEnv;

  await printExternalDeployEnvGuidance();
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
