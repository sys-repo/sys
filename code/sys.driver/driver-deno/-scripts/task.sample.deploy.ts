import { Cli } from '@sys/cli';
import { c } from '@sys/cli';
import { Args } from '@sys/std';
import { type SampleDeployConfig, requireSampleDeployConfig, SAMPLE_ENV_NOTE } from './u.env.ts';

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
  const reporter = DenoDeploy.Fmt.listen(deployment, {
    afterConfig() {
      return templateProvenance();
    },
  });

  try {
    await deployment.run();
  } catch (error) {
    reporter.dispose();
    await printDeployLogs(config);
    throw error;
  } finally {
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

function templateProvenance() {
  const items = [
    c.gray('@sys/tmpl/repo (workspace)'),
    `${c.gray('@sys/tmpl/pkg/')}${c.cyan('foo')}`,
    `${c.gray('@sys/tmpl/pkg/')}${c.cyan('bar')}`,
    `${c.gray('@sys/tmpl/pkg/')}${c.cyan('baz')}${c.gray(c.italic(' ← (pruned)'))}`,
  ] as const;
  return [
    '',
    c.gray('Templates:'),
    ...items.map((item, i) => ` ${Cli.Fmt.Tree.branch([i, items])} ${item}`),
    '',
  ] as const;
}

async function printDeployLogs(config: SampleDeployConfig) {
  const [{ DeployCli }, { Fs, Process }] = await Promise.all([
    import('../src/m.cloud/u.cli.deploy/mod.ts'),
    import('../src/common.ts'),
  ]);

  const prepared = await DeployCli.logs({
    app: config.app,
    ...(config.org ? { org: config.org } : {}),
    ...(config.token ? { token: config.token } : {}),
  });

  try {
    const output = await Process.invoke({
      cmd: prepared.cli.cmd,
      args: [...prepared.cli.args],
      cwd: prepared.cli.cwd,
      silent: true,
    });

    const stdout = output.text.stdout.trim();
    const stderr = output.text.stderr.trim();
    const body = [stdout, stderr].filter((value) => value.length > 0).join('\n\n');
    if (body.length === 0) return;

    console.info('');
    console.info(c.bold(c.yellow('Deploy Logs')));
    console.info(c.bold(c.yellow(Cli.Fmt.hr())));
    console.info(body);
    console.info(c.bold(c.yellow(Cli.Fmt.hr())));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.info(c.yellow(c.italic(`Unable to fetch deploy logs: ${message}`)));
  } finally {
    await Fs.remove(prepared.root);
  }
}
