import { Args, type t } from './common.ts';

export function parseArgs(argv: string[] = []): t.DeployTool.CliParsedArgs {
  const args = Args.parse<t.DeployTool.CliArgs>(argv, {
    alias: { h: 'help' },
    boolean: ['help', 'non-interactive', 'force'],
    string: ['config', 'action'],
  });

  return {
    ...args,
    interactive: args['non-interactive'] !== true,
  };
}
