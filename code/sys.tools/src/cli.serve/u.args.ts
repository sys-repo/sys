import { Args, type t } from './common.ts';
import { CliStartTargetSelectorKeys } from './u.startTarget.ts';

export function parseArgs(argv: string[] = []): t.ServeTool.CliParsedArgs {
  const args = Args.parse<t.ServeTool.CliArgs>(argv, {
    alias: { h: 'help' },
    boolean: ['help', 'open', 'non-interactive'],
    string: [...CliStartTargetSelectorKeys, 'host'],
  });

  return {
    ...args,
    interactive: args['non-interactive'] !== true,
  };
}
