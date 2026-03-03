import { type t, Args } from './common.ts';

export function parseArgs(argv: string[] = []): t.TmplTool.CliParsedArgs {
  const args = Args.parse<t.TmplTool.CliArgs>(argv, {
    alias: { h: 'help' },
    boolean: ['help'],
  });
  return args;
}
