import { DenoDeploy } from '../mod.ts';
import { describe, it } from './common.ts';
import { assertStageUsesGeneratedRootEntry } from './u.assert.ts';
import { Sample } from './mod.ts';

describe('DenoDeploy.pipeline (external staged)', () => {
  it('deploys a staged tmpl repo/pkg target through the extracted pipeline', async () => {
    const config = await Sample.Config.externalDeploy();
    const { pkgDir } = await Sample.Fixture.createDeployableRepoPkg();
    const deployment = DenoDeploy.pipeline({ pkgDir, config });
    const reporter = DenoDeploy.Fmt.listen(deployment);
    let result;
    try {
      result = await deployment.run();
    } finally {
      reporter.dispose();
    }

    await assertStageUsesGeneratedRootEntry(result.prepared);
  });
});
