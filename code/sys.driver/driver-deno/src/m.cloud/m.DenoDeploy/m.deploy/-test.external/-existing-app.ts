import { c, describe, it } from './common.ts';
import { DenoDeploy } from '../../mod.ts';
import { printExternalDeployInfo, requireDeployEnv, toDeployFailure } from './u.env.ts';
import { createDeployableRepoPkg, prepareStageForExistingApp } from './u.fixture.ts';

describe('DenoDeploy.deploy (external)', () => {
  it('prints the external Deno Deploy config', () => {
    printExternalDeployInfo();
  });

  it('deploys a staged tmpl repo/pkg target to an existing Deno Deploy app', async () => {
    const deployEnv = requireDeployEnv();
    const { pkgDir } = await createDeployableRepoPkg();
    const stage = await DenoDeploy.stage({ target: { dir: pkgDir } });
    await prepareStageForExistingApp(stage);
    const result = await DenoDeploy.deploy({
      stage,
      app: deployEnv.app,
      ...(deployEnv.org ? { org: deployEnv.org } : {}),
      ...(deployEnv.token ? { token: deployEnv.token } : {}),
      silent: true,
    });

    if (!result.ok) {
      if ('error' in result) throw result.error;
      throw new Error(toDeployFailure(result));
    }

    printDeployResult(result);
    if (!result.deploy?.previewUrl) throw new Error('Expected DenoDeploy.deploy to return previewUrl.');
  });
});

function printDeployResult(result: Extract<Awaited<ReturnType<typeof DenoDeploy.deploy>>, { ok: true }>) {
  console.info(c.cyan('DenoDeploy (live external deploy result):'));
  console.info('');
  console.info({
    ok: result.ok,
    code: result.code,
    deploy: result.deploy,
  });
  console.info('');
  printDeployEndpoints(result);
}

function printDeployEndpoints(result: Extract<Awaited<ReturnType<typeof DenoDeploy.deploy>>, { ok: true }>) {
  console.info(c.gray('Endpoints:'));
  if (result.deploy?.revisionUrl) {
    console.info(`  ${c.gray('revision:'.padEnd(11))} ${c.white(result.deploy.revisionUrl)}`);
  }
  if (result.deploy?.previewUrl) {
    console.info(`  ${c.gray('preview:'.padEnd(11))} ${c.white(result.deploy.previewUrl)}`);
  }
  console.info('');
}
