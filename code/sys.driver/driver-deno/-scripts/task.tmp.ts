import { DenoDeploy } from '../src/m.cloud/mod.ts';
import * as sample from '../src/m.cloud/m.DenoDeploy/-test.sample/mod.ts';

const config = sample.requireTmpDeployConfig();
const { pkgDir } = await sample.createDeployableRepoPkg();
const deployment = DenoDeploy.pipeline({ pkgDir, config });
const reporter = DenoDeploy.Fmt.listen(deployment);

try {
  await deployment.run();
} finally {
  reporter.dispose();
}
