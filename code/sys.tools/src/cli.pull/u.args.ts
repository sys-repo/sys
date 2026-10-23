import { Args, Obj, type t } from './common.ts';

export function parseArgs(argv: string[] = []): t.PullTool.CliParsedArgs {
  const args = Args.parse<t.PullTool.CliArgs>(argv, {
    alias: { h: 'help' },
    boolean: ['help', 'dry-run', 'non-interactive'],
    string: ['config', 'manifest', 'scheme', 'digest', 'store', 'project', 'mode'],
  });

  if (Obj.hasOwn(args, 'integrity')) {
    throw new Error(
      'Pull: --integrity is unsupported; supply an independent --scheme and --digest.',
    );
  }
  const command = parseCommand(args._[0]);
  if (command !== 'add') {
    for (const key of ['manifest', 'scheme', 'digest', 'store', 'project', 'mode', 'dry-run']) {
      if (Obj.hasOwn(args, key)) throw new Error(`Pull: --${key} requires the add command.`);
    }
  }
  return {
    ...args,
    command,
    interactive: args['non-interactive'] !== true,
  };
}

function parseCommand(input: unknown): t.PullTool.CliCommand | undefined {
  return input === 'add' ? input : undefined;
}
