import { DenoDeploy } from '../mod.ts';
import { describe, it } from './common.ts';
import { assertStageUsesGeneratedRootEntry } from './u.assert.ts';
import { requireDeployConfig } from './mod.ts';

import * as fixture from '../-test.sample/mod.ts';

describe('DenoDeploy.pipeline (external staged)', () => {
  it('deploys a staged tmpl repo/pkg target through the extracted pipeline', async () => {
    const config = await requireDeployConfig();
    const { pkgDir } = await fixture.createDeployableRepoPkg();
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
