import { type t, Args } from './common.ts';

export function parseArgs(argv: string[] = []): t.PullTool.CliParsedArgs {
  const args = Args.parse<t.PullTool.CliArgs>(argv, {
    alias: { h: 'help' },
    boolean: ['help', 'no-interactive'],
    string: ['config'],
  });

  return {
    ...args,
    interactive: args['no-interactive'] !== true,
  };
}
