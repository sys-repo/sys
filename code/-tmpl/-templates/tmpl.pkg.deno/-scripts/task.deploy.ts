import { DenoDeploy } from '@sys/driver-deno/cloud';
import { Env } from '@sys/fs';

const env = await Env.load({ search: 'upward' });

const deployment = DenoDeploy.pipeline({
  pkgDir: new URL('..', import.meta.url).pathname,
  config: {
    app: env.get('DENO_DEPLOY_APP'),
    org: env.get('DENO_DEPLOY_ORG'),
    token: env.get('DENO_DEPLOY_TOKEN'),
  },
});
const reporter = DenoDeploy.Fmt.listen(deployment);

try {
  await deployment.run();
} finally {
  reporter.dispose();
}
