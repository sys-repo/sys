import { Env } from './common.ts';
import { FmtInternal } from '../m.fmt/mod.ts';
import { type t } from './common.ts';
import { DeployConfig } from '../u.deployConfig.ts';

export type DeployEnv = {
  readonly app?: string;
  readonly org?: string;
  readonly token?: string;
};

type DeployEnvGuidanceArgs = {
  readonly title: string;
  readonly what: string;
  readonly why: string;
  readonly retry: string;
  readonly notes?: readonly string[];
};

export async function loadDeployEnv(): Promise<DeployEnv> {
  const env = await Env.load({ search: 'upward' });
  const app = env.get('DENO_DEPLOY_APP').trim();
  const org = env.get('DENO_DEPLOY_ORG').trim();
  const token = env.get('DENO_DEPLOY_TOKEN').trim();

  return {
    ...(app.length > 0 ? { app } : {}),
    ...(org.length > 0 ? { org } : {}),
    ...(token.length > 0 ? { token } : {}),
  };
}

export async function resolveDeployRequestEnv(request: t.DenoDeploy.Deploy.Request): Promise<t.DenoDeploy.Deploy.Request> {
  const deployEnv = await loadDeployEnv();
  const config = DeployConfig.normalize({
    app: request.app,
    ...(request.org !== undefined ? { org: request.org } : {}),
    ...(request.token !== undefined ? { token: request.token } : {}),
  });

  return {
    ...request,
    app: config.app.length > 0 ? config.app : (deployEnv.app ?? ''),
    ...(config.org ? { org: config.org } : deployEnv.org ? { org: deployEnv.org } : {}),
    ...(config.token ? { token: config.token } : deployEnv.token ? { token: deployEnv.token } : {}),
  };
}

export function printDeployEnvGuidance(args: DeployEnvGuidanceArgs) {
  for (const line of FmtInternal.envVarsNotFound(args)) console.info(line);
}

export function toDeployEnvNotes(args: {
  readonly app: string;
  readonly org: string;
  readonly token: string;
}) {
  return [
    note('DENO_DEPLOY_APP', args.app),
    note('DENO_DEPLOY_TOKEN', args.token),
    note('DENO_DEPLOY_ORG', args.org),
    note('DENO_DEPLOY_REGION', 'is shown for the future create flow.'),
  ] as const;
}

function note(key: string, detail: string) {
  return `  ${key.padEnd(20)} ${detail}`;
}
