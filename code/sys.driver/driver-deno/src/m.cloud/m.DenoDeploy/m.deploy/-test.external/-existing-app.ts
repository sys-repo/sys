import { describe, it } from './common.ts';
import { DenoDeploy } from '../../mod.ts';
import { requireDeployEnv, toDeployFailure } from './u.env.ts';
import { createDeployableRepoPkg } from './u.fixture.ts';

describe('DenoDeploy.deploy (external)', () => {
  it('deploys a staged tmpl repo/pkg target to an existing Deno Deploy app', async () => {
    const deployEnv = requireDeployEnv();
    const { pkgDir } = await createDeployableRepoPkg();
    const stage = await DenoDeploy.stage({ target: { dir: pkgDir } });
    const result = await DenoDeploy.deploy({
      stage,
      app: deployEnv.app,
      ...(deployEnv.org ? { org: deployEnv.org } : {}),
      ...(deployEnv.token ? { token: deployEnv.token } : {}),
    });

    if (!result.ok) {
      if ('error' in result) throw result.error;
      throw new Error(toDeployFailure(result));
    }
  });
});
