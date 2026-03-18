import { DenoDeploy } from '../mod.ts';
import { describe, it } from './common.ts';
import { assertPreviewServesBuiltApp, assertStageUsesGeneratedRootEntry } from './u.assert.ts';
import { printExternalDeployInfo, requireDeployEnv, toDeployFailure } from './u.env.ts';
import * as fixture from './u.fixture.ts';
import { printDeployResult } from './u.report.ts';

describe('DenoDeploy.deploy (external staged)', () => {
  it('prints the external DenoDeploy config', () => printExternalDeployInfo());

  it('deploys a staged tmpl repo/pkg target through the staged root entry pair', async () => {
    const deployEnv = requireDeployEnv();
    const { pkgDir } = await fixture.createDeployableRepoPkg();
    const stage = await DenoDeploy.stage({ target: { dir: pkgDir } });
    const entrypoint = await fixture.prepareStageForExistingApp(stage);
    await assertStageUsesGeneratedRootEntry(entrypoint);
    fixture.printDeployEntrypointInfo(entrypoint);

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
    if (!result.deploy?.url?.preview) {
      throw new Error('Expected DenoDeploy.deploy to return deploy.url.preview.');
    }
    await assertPreviewServesBuiltApp(result.deploy.url.preview);
  });
});
