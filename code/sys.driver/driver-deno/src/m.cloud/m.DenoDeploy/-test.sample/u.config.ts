import { loadDeployEnv, printDeployEnvGuidance, toDeployEnvNotes } from '../m.deploy/u.env.ts';
import { type t } from './common.ts';

type RequireDeployConfigArgs = {
  readonly retry: string;
  readonly appNote: string;
};

export async function externalDeployConfig(): Promise<t.DenoDeploy.DeployConfig> {
  return requireDeployConfig({
    retry: 'deno task test:external',
    appNote: 'is required for this test lane.',
  });
}

export async function sampleDeployConfig(): Promise<t.DenoDeploy.DeployConfig> {
  return requireDeployConfig({
    retry: 'deno task sample:deploy',
    appNote: 'is required for this sample run.',
  });
}

async function requireDeployConfig(args: RequireDeployConfigArgs): Promise<t.DenoDeploy.DeployConfig> {
  const deployEnv = await loadDeployEnv();
  if (!deployEnv.app) {
    printDeployEnvGuidance({
      title: 'DENO DEPLOY ENVIRONMENT VARIABLES NOT FOUND',
      what: 'A staged deploy sample needs an existing target app.',
      why: 'DENO_DEPLOY_APP was not found in the current process env or nearest upward .env files.',
      retry: args.retry,
      notes: toDeployEnvNotes({
        app: args.appNote,
        token: deployEnv.token ? 'is present.' : 'is optional if already authenticated; recommended for headless use.',
        org: deployEnv.org ? 'is present.' : 'is optional when current CLI org context is enough.',
      }),
    });
    throw new Error(`Missing DENO_DEPLOY_APP. Retry with: ${args.retry}`);
  }

  return {
    app: deployEnv.app,
    ...(deployEnv.org ? { org: deployEnv.org } : {}),
    ...(deployEnv.token ? { token: deployEnv.token } : {}),
  };
}
