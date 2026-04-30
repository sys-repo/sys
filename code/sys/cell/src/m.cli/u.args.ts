import { Args, type t } from './common.ts';

export function parseArgs(argv: readonly string[] = []): t.CellCli.ParsedArgs {
  const normalized = argv[0] === '--' ? argv.slice(1) : argv;
  const args = Args.parse<{ help?: boolean }>([...normalized], {
    boolean: ['help'],
    alias: { h: ['help'] },
  });

  return {
    help: args.help ?? false,
    _: args._,
  };
}
