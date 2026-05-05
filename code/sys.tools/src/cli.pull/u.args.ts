import { Args, type t } from './common.ts';

export function parseArgs(argv: string[] = []): t.PullTool.CliParsedArgs {
  const args = Args.parse<t.PullTool.CliArgs>(argv, {
    alias: { h: 'help' },
    boolean: ['help', 'dry-run', 'non-interactive'],
    string: ['config', 'dist', 'local'],
  });

  const command = parseCommand(args._[0]);
  return {
    ...args,
    command,
    interactive: args['non-interactive'] !== true,
  };
}

function parseCommand(input: unknown): t.PullTool.CliCommand | undefined {
  return input === 'add' ? input : undefined;
}
