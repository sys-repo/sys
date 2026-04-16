import { Args, Cli, type t } from './common.ts';
import { SlugDataPipeline } from '../m.DataPipeline/mod.ts';
import { Fmt } from './u.fmt.ts';
import { FmtHelp } from './u.help.ts';
import { menu } from './u.menu.ts';
import { runCreateProfile } from './u.create.ts';
import { runStageProfile } from './u.stage.ts';
import { StageProfileFs } from './u.fs.ts';
import { withStageSpinner } from './u.spin.ts';

const COMMANDS = new Set<t.SlugDataCli.Command>(['create', 'stage', 'refresh']);

/**
 * Parse and run the staging CLI.
 */
export async function run(input: t.SlugDataCli.Input = {}): Promise<t.SlugDataCli.Result> {
  const cwd = input.cwd ?? Deno.cwd() as t.StringDir;
  const argv = [...(input.argv ?? Deno.args)];
  const args = parseArgs(argv);
  const target = args.target ?? input.target;

  if (args.help) return { kind: 'help', text: FmtHelp.output() };
  if (!args.command) return menu(cwd, target);

  if (args.command === 'refresh') {
    if (!target) throw new Error(`Missing --target for '${args.command}'`);
    return Cli.Spinner.with(
      Fmt.spinnerText('refreshing staged root...'),
      () => SlugDataPipeline.refreshRoot({ root: target }),
    );
  }

  const profile = args.profile;
  if (!profile) throw new Error(`Missing --profile for '${args.command}'`);

  if (args.command === 'create') {
    const source = args.source;
    if (!source) throw new Error(`Missing --source for '${args.command}'`);
    return runCreateProfile({ cwd, profile, source });
  }

  return withStageSpinner((onProgress) =>
    runStageProfile({ cwd, path: StageProfileFs.path(cwd, profile), target, onProgress })
  );
}

function parseArgs(argv: string[]): t.SlugDataCli.Args {
  const args = Args.parse<Omit<t.SlugDataCli.Args, 'command'>>(argv, {
    alias: { h: 'help' },
    boolean: ['help'],
    string: ['profile', 'source', 'target'],
  });
  const head = args._[0];
  const command = isCommand(head) ? head : undefined;
  return { ...args, command };
}

function isCommand(value: unknown): value is t.SlugDataCli.Command {
  return typeof value === 'string' && COMMANDS.has(value as t.SlugDataCli.Command);
}
