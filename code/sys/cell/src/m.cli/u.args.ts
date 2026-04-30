import { Args, type t } from './common.ts';

export function parseArgs(argv: readonly string[] = []): t.CellCli.ParsedArgs {
  const normalized = argv[0] === '--' ? argv.slice(1) : argv;
  const unknown: string[] = [];
  const args = Args.parse<{ help?: boolean; 'dry-run'?: boolean }>([...normalized], {
    boolean: ['help', 'dry-run'],
    alias: { h: ['help'] },
    unknown(flag) {
      unknown.push(flag);
      return false;
    },
  });

  return {
    help: args.help ?? false,
    dryRun: args['dry-run'] ?? false,
    unknown,
    _: args._,
  };
}
