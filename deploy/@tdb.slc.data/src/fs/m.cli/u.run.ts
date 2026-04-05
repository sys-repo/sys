import { Args, type t } from './common.ts';
import { SlcDataPipeline } from '../m.DataPipeline/mod.ts';
import { FmtHelp } from './u.help.ts';
import { menu } from './u.menu.ts';
import { runCreateProfile } from './u.create.ts';
import { runStageProfile } from './u.stage.ts';
import { StageProfileFs } from './u.fs.ts';

const COMMANDS = new Set<t.SlcDataCli.Command>(['create', 'stage', 'refresh']);

/**
 * Parse and run the staging CLI.
 */
export async function run(input: t.SlcDataCli.Input = {}): Promise<t.SlcDataCli.Result> {
  const cwd = input.cwd ?? Deno.cwd() as t.StringDir;
  const argv = [...(input.argv ?? Deno.args)];
  const args = parseArgs(argv);
  const target = args.target ?? input.target;

  if (args.help) return { kind: 'help', text: FmtHelp.output() };
  if (!args.command) return menu(cwd, target);

  if (args.command === 'refresh') {
    if (!target) throw new Error(`Missing --target for '${args.command}'`);
    return SlcDataPipeline.refreshRoot({ root: target });
  }

  const profile = args.profile;
  if (!profile) throw new Error(`Missing --profile for '${args.command}'`);

  if (args.command === 'create') {
    const source = args.source;
    if (!source) throw new Error(`Missing --source for '${args.command}'`);
    return runCreateProfile({ cwd, profile, source });
  }

  return runStageProfile({ cwd, path: StageProfileFs.path(cwd, profile), target });
}

function parseArgs(argv: string[]): t.SlcDataCli.Args {
  const args = Args.parse<Omit<t.SlcDataCli.Args, 'command'>>(argv, {
    alias: { h: 'help' },
    boolean: ['help'],
    string: ['profile', 'source', 'target'],
  });
  const head = args._[0];
  const command = isCommand(head) ? head : undefined;
  return { ...args, command };
}

function isCommand(value: unknown): value is t.SlcDataCli.Command {
  return typeof value === 'string' && COMMANDS.has(value as t.SlcDataCli.Command);
}
