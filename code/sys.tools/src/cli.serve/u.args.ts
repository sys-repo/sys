import { type t, Args } from './common.ts';

export function parseArgs(argv: string[] = []): t.ServeTool.CliParsedArgs {
  const args = Args.parse<t.ServeTool.CliArgs>(argv, {
    alias: { h: 'help' },
    boolean: ['help', 'no-interactive'],
  });

  return {
    ...args,
    interactive: args['no-interactive'] !== true,
  };
}
