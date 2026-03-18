import { DenoDeploy } from '../src/m.cloud/mod.ts';
import {
  printExternalDeployInfo,
  requireDeployConfig,
} from '../src/m.cloud/m.DenoDeploy/-test.external/u.env.ts';
import * as fixture from '../src/m.cloud/m.DenoDeploy/-test.external/u.fixture.ts';
import { printDeployResult } from '../src/m.cloud/m.DenoDeploy/-test.external/u.report.ts';

printExternalDeployInfo();

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
printDeployResult(result.deploy, 'tmp staged pipeline result');
