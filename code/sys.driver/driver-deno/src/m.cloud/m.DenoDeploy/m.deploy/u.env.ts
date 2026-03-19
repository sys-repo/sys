import { Env } from './common.ts';
import { FmtInternal } from '../m.fmt/mod.ts';
import { type t } from './common.ts';

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

const env = await Env.load({ search: 'upward' });

export function loadDeployEnv(): DeployEnv {
  const app = env.get('DENO_DEPLOY_APP').trim();
  const org = env.get('DENO_DEPLOY_ORG').trim();
  const token = env.get('DENO_DEPLOY_TOKEN').trim();

  return {
    ...(app.length > 0 ? { app } : {}),
    ...(org.length > 0 ? { org } : {}),
    ...(token.length > 0 ? { token } : {}),
  };
}

export function resolveDeployRequestEnv(request: t.DenoDeploy.Deploy.Request): t.DenoDeploy.Deploy.Request {
  const deployEnv = loadDeployEnv();
  const app = request.app.trim();
  const org = request.org?.trim() ?? '';
  const token = request.token?.trim() ?? '';

  return {
    ...request,
    app: app.length > 0 ? app : (deployEnv.app ?? ''),
    ...(org.length > 0 ? { org } : deployEnv.org ? { org: deployEnv.org } : {}),
    ...(token.length > 0 ? { token } : deployEnv.token ? { token: deployEnv.token } : {}),
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
