import { c } from '@sys/cli';
console.info(c.gray(c.italic('preparing sample fixture...\n')));

/**
 * Sample deployment example:
 */
async function main() {
  const sample = await import('../src/m.cloud/m.DenoDeploy/-test.sample/mod.ts');
  const { DenoDeploy } = await import('@sys/driver-deno/cloud');

  const config = await sample.requireTmpDeployConfig();
  const { pkgDir } = await sample.createDeployableRepoPkg();

  const deployment = DenoDeploy.pipeline({ pkgDir, config });
  const reporter = DenoDeploy.Fmt.listen(deployment);

  try {
    await deployment.run();
  } finally {
    reporter.dispose();
  }
}

/**
 * Entry:
 */
if (import.meta.main) await main();
