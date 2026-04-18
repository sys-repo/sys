import { c } from '@sys/cli';
import { loadDeployEnv } from '../src/m.cloud/m.DenoDeploy/m.deploy/u.env.ts';
import { t } from '../src/common.ts';

type SampleCreateEnv = {
  readonly org: string;
  readonly token: string;
};

export type SampleDeployConfig = t.DenoDeploy.DeployConfig;

export const SAMPLE_ENV_NOTE = {
  deploy: `Requires DENO_DEPLOY_APP. DENO_DEPLOY_ORG and DENO_DEPLOY_TOKEN are optional when current CLI context is enough.`,
  createApp: `Requires DENO_DEPLOY_ORG and DENO_DEPLOY_TOKEN.`,
} as const;

export async function requireSampleCreateEnv(): Promise<SampleCreateEnv> {
  const env = await loadDeployEnv();
  const org = env.org?.trim() ?? '';
  const token = env.token?.trim() ?? '';

  if (org.length === 0 || token.length === 0) {
    const msg = 'DENO_DEPLOY_ORG and DENO_DEPLOY_TOKEN are required for sample:create-app.';
    console.info(c.yellow(c.italic(msg)));
    throw new Error('Missing DENO_DEPLOY_ORG or DENO_DEPLOY_TOKEN.');
  }

  return { org, token };
}

export async function requireSampleDeployConfig(): Promise<SampleDeployConfig> {
  const env = await loadDeployEnv();
  const app = env.app?.trim() ?? '';

  if (app.length === 0) {
    console.info(c.yellow(c.italic('DENO_DEPLOY_APP is required for sample:deploy.')));
    throw new Error('Missing DENO_DEPLOY_APP.');
  }

  return {
    app,
    ...(env.org ? { org: env.org } : {}),
    ...(env.token ? { token: env.token } : {}),
  };
}
