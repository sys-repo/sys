import { type t, Args } from './common.ts';

export function parseArgs(argv: string[] = []): t.ServeTool.CliParsedArgs {
  const args = Args.parse<t.ServeTool.CliArgs>(argv, {
    alias: { h: 'help' },
    boolean: ['help', 'open', 'non-interactive'],
    string: ['config', 'dir', 'host'],
  });

  return {
    ...args,
    interactive: args['non-interactive'] !== true,
  };
}
