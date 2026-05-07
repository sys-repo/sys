import { Args, type t } from './common.ts';

export function parseArgs(argv: readonly string[] = []): t.CellCli.ParsedArgs {
  const normalized = argv[0] === '--' ? argv.slice(1) : argv;
  const unknown: string[] = [];
  const args = Args.parse<{
    help?: boolean;
    agent?: boolean;
    'dry-run'?: boolean;
    format?: string | boolean | (string | boolean)[];
  }>([...normalized], {
    boolean: ['help', 'agent', 'dry-run'],
    string: ['format'],
    alias: { h: ['help'] },
    unknown(flag) {
      unknown.push(flag);
      return false;
    },
  });

  return {
    help: args.help ?? false,
    dryRun: args['dry-run'] ?? false,
    agent: args.agent ?? false,
    format: args.format,
    unknown,
    _: args._,
  };
}
