import { Cli } from '@sys/cli';
import { c } from '@sys/cli';
import { Args } from '@sys/std/args';
import { Is } from '@sys/std/is';
import { slug } from '@sys/std/random';
import { requireSampleCreateEnv, SAMPLE_ENV_NOTE } from './u.env.ts';

async function main() {
  const argv = Args.parse(Deno.args, {
    boolean: ['help'],
    alias: { h: 'help' },
  });

  if (argv.help) {
    Cli.Fmt.Help.render(HELP);
    return;
  }

  console.info('');
  const boot = Cli.spinner(Cli.Fmt.spinnerText(c.italic(c.gray('preparing sample app creation...')))).start();
  try {
    const appArg = Is.str(argv._[0]) ? argv._[0].trim() : '';
    const app = appArg.length > 0 ? appArg : `foo-${slug()}`;
    const { org, token } = await requireSampleCreateEnv();

    const { DenoDeploy } = await import('@sys/driver-deno/cloud');
    const { Sample } = await import('../src/m.cloud/m.DenoDeploy/-test.sample/mod.ts');
    const prepared = await Sample.Stage.forCreate({
      app,
      org,
      token,
      onBeforeOutput() {
        boot.stop();
      },
    });

    /**
     * The actual public API call.
     *
     * Everything above prepares a canonical staged sample artifact;
     * this call creates the Deno Deploy app resource from that root.
     */
    const result = await DenoDeploy.App.create({
      root: prepared.stagedDir,
      config: './deno.json',
      app,
      org,
      token,

      // Sample-only explicit create settings for the staged dynamic root:
      region: 'global',
      noWait: true,
      doNotUseDetectedBuildConfig: true,
      appDirectory: './',
      installCommand: 'true',
      buildCommand: 'true',
      preDeployCommand: 'true',
      runtimeMode: 'dynamic',
      entrypoint: './entry.ts',
      workingDirectory: './',
      log: true,
    });

    if (!result.ok) {
      if ('error' in result) throw result.error;
      const details = [result.stderr.trim(), result.stdout.trim()]
        .filter((v) => v.length > 0)
        .join('\n');
      if (details.length > 0) throw new Error(details);
      throw new Error(`DenoApp.create failed (code ${result.code}).`);
    }
  } finally {
    boot.stop();
  }
}

/**
 * Main Entry
 */
if (import.meta.main) await main();

const HELP = {
  tool: 'deno task sample:create-app',
  summary: 'Create a real Deno Deploy app from a generated sample repo/package.',
  note: SAMPLE_ENV_NOTE.createApp,
  usage: ['deno task sample:create-app', 'deno task sample:create-app -- <app-name>'],
  options: [['-h, --help', 'show help']],
  examples: ['deno task sample:create-app', 'deno task sample:create-app -- foo-my-app'],
} as const;
