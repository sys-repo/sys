import { type t, Args } from './common.ts';

export function parseArgs(argv: string[] = []): t.PullTool.CliParsedArgs {
  return Args.parse<t.PullTool.CliArgs>(argv, {
    alias: { h: 'help' },
    boolean: ['help'],
  });
}
