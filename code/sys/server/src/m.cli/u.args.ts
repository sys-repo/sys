import { Args, type t } from './common.ts';

export function parseArgs(argv: readonly string[] = []): t.ServerCli.ParsedArgs {
  const normalized = argv[0] === '--' ? argv.slice(1) : argv;
  const unknown: string[] = [];
  const args = Args.parse<{
    help?: boolean;
    format?: string | boolean | (string | boolean)[];
  }>([...normalized], {
    boolean: ['help'],
    string: ['format'],
    alias: { h: ['help'] },
    unknown(flag) {
      unknown.push(flag);
      return false;
    },
  });

  return {
    help: args.help ?? false,
    format: args.format,
    unknown,
    _: args._,
  };
}
