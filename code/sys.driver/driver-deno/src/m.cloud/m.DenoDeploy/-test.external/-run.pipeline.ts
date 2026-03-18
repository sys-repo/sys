import { DenoDeploy } from '../mod.ts';
import { describe, it } from './common.ts';
import { assertStageUsesGeneratedRootEntry } from './u.assert.ts';
import { printExternalDeployInfo, requireDeployConfig } from './u.env.ts';
import { printDeployResult } from './u.report.ts';

import * as fixture from './u.fixture.ts';

describe('DenoDeploy.pipeline (external staged)', () => {
  it('prints the external DenoDeploy config', () => printExternalDeployInfo());

  it('deploys a staged tmpl repo/pkg target through the extracted pipeline', async () => {
    const config = requireDeployConfig();
    const { pkgDir } = await fixture.createDeployableRepoPkg();
    const deployment = DenoDeploy.pipeline({
      pkgDir,
      config,
      verify: { preview: true },
      silent: true,
    });

    deployment.$.subscribe((step) => {
      if (step.kind === 'prepare:done') fixture.printDeployEntrypointInfo(step.prepared);
    });

    const result = await deployment.run();

    await assertStageUsesGeneratedRootEntry(result.prepared);
    printDeployResult(result.deploy, 'external staged pipeline result');
  });
});
