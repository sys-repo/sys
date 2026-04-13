import { Cli } from '@sys/cli';
import { c } from '@sys/cli';
import { Args } from '@sys/std';
import { requireSampleDeployConfig, SAMPLE_ENV_NOTE } from './u.env.ts';

/**
 * Sample deployment example:
 */
async function main() {
  const argv = Args.parse(Deno.args, {
    boolean: ['help', 'prod', 'production'],
    alias: { h: 'help', production: 'prod' },
  });

  if (argv.help) {
    Cli.Fmt.Help.render(HELP);
    return;
  }

  console.info('');
  const boot = Cli.spinner(Cli.Fmt.spinnerText(c.italic(c.gray('preparing sample deploy...')))).start();
  let reporter: { dispose(): void } | undefined;
  try {
    const { DenoDeploy } = await import('@sys/driver-deno/cloud');
    const { Sample } = await import('../src/m.cloud/m.DenoDeploy/-test.sample/mod.ts');
    const config = await requireSampleDeployConfig();
    const { pkgDir } = await Sample.Fixture.createDeployableRepoPkg();

    const deployment = DenoDeploy.pipeline({
      pkgDir,
      config: {
        ...config,
        prod: argv.prod === true,
      },
    });
    reporter = DenoDeploy.Fmt.listen(deployment, {
      afterConfig() {
        return templateProvenance();
      },
    });

    boot.stop();
    await deployment.run();
    return 0;
  } catch (error) {
    boot.stop();
    if (!reporter) throw error;
    return 1;
  } finally {
    boot.stop();
    reporter?.dispose();
  }
}

/**
 * Main Entry
 */
if (import.meta.main) Deno.exit(await main());

const HELP = {
  tool: 'deno task sample:deploy',
  summary: 'Deploy a generated sample repo/package through the staged DenoDeploy pipeline.',
  note: `Creates a temporary sample workspace and performs a real deploy. ${SAMPLE_ENV_NOTE.deploy}`,
  usage: ['deno task sample:deploy [--prod|--production]'],
  options: [
    ['-h, --help', 'show help'],
    ['--prod, --production', 'deploy directly to production'],
  ],
  examples: ['deno task sample:deploy', 'deno task sample:deploy --prod'],
} as const;

function templateProvenance() {
  const items = [
    c.gray('@sys/tmpl/repo (workspace)'),
    templatePkg('foo'),
    templatePkg('bar'),
    `${templatePkg('baz', 'brightYellow')}${c.gray(c.italic(' ← (pruned)'))}`,
  ] as const;
  return [
    '',
    c.gray('Templates:'),
    ...items.map((item, i) => ` ${Cli.Fmt.Tree.branch([i, items])} ${item}`),
    '',
  ] as const;
}

function templatePkg(name: string, tone: 'cyan' | 'brightYellow' = 'cyan') {
  return `${c.gray('@sys/tmpl/pkg/')}${c[tone](name)}`;
}
