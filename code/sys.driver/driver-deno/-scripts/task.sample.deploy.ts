import { Cli } from '@sys/cli';
import { c } from '@sys/cli';
import { Args } from '@sys/std';
import { requireSampleDeployConfig, SAMPLE_ENV_NOTE } from './u.env.ts';

/**
 * Sample deployment example:
 */
async function main() {
  const argv = Args.parse(Deno.args, {
    boolean: ['help'],
    alias: { h: 'help' },
  });

  if (argv.help) {
    Cli.Fmt.Help.render(HELP);
    return;
  }

  const { DenoDeploy } = await import('@sys/driver-deno/cloud');
  const { Sample } = await import('../src/m.cloud/m.DenoDeploy/-test.sample/mod.ts');
  const config = await requireSampleDeployConfig();
  const { pkgDir } = await Sample.Fixture.createDeployableRepoPkg();

  const deployment = DenoDeploy.pipeline({ pkgDir, config });
  let printedTemplates = false;
  const note = deployment.$.subscribe((step) => {
    if (printedTemplates || step.kind !== 'stage:start') return;
    printedTemplates = true;
    console.info(
      [
        c.gray(` ${Cli.Fmt.Tree.last}${Cli.Fmt.Tree.bar} @sys/tmpl/repo (workspace)`),
        c.gray(`   ${Cli.Fmt.Tree.last}${Cli.Fmt.Tree.bar} @sys/tmpl/pkg`),
      ].join('\n'),
    );
  });
  const reporter = DenoDeploy.Fmt.listen(deployment);

  try {
    await deployment.run();
  } finally {
    note.unsubscribe();
    reporter.dispose();
  }
}

/**
 * Main Entry
 */
if (import.meta.main) await main();

const HELP = {
  tool: 'deno task sample:deploy',
  summary: 'Deploy a generated sample repo/package through the staged DenoDeploy pipeline.',
  note: `Creates a temporary sample workspace and performs a real deploy. ${SAMPLE_ENV_NOTE.deploy}`,
  usage: ['deno task sample:deploy'],
  options: [['-h, --help', 'show help']],
  examples: ['deno task sample:deploy'],
} as const;
