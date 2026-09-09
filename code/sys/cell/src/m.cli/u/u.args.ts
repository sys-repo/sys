import { Args, type t } from '../common.ts';

export function parseArgs(argv: readonly string[] = []): t.CellCli.ParsedArgs {
  const normalized = argv[0] === '--' ? argv.slice(1) : argv;
  const unknown: string[] = [];
  const args = Args.parse<{
    help?: boolean;
    agent?: boolean;
    'dry-run'?: boolean;
    plan?: boolean;
    force?: boolean;
    format?: string | boolean | (string | boolean)[];
    mode?: string | boolean | (string | boolean)[];
    reporter?: string | boolean | (string | boolean)[];
  }>([...normalized], {
    boolean: ['help', 'agent', 'dry-run', 'plan', 'force'],
    string: ['format', 'mode', 'reporter'],
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
    plan: args.plan ?? false,
    force: args.force ?? false,
    format: args.format,
    mode: args.mode,
    reporter: args.reporter,
    unknown,
    _: args._,
  };
}
