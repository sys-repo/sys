import { DenoDeploy } from '@sys/driver-deno/cloud';
import { Env } from '@sys/fs';
import { Args } from '@sys/std';

const argv = Args.parse(Deno.args, {
  boolean: ['prod', 'production'],
  alias: { production: 'prod' },
});
const env = await Env.load({ search: 'upward' });

const deployment = DenoDeploy.pipeline({
  pkgDir: new URL('..', import.meta.url).pathname,
  autoCreate: true,
  config: {
    app: 'sample-proxy',
    org: env.get('DENO_DEPLOY_ORG'),
    token: env.get('DENO_DEPLOY_TOKEN'),
    prod: argv.prod === true,
  },
});
const reporter = DenoDeploy.Fmt.listen(deployment);

try {
  await deployment.run();
} finally {
  reporter.dispose();
}
