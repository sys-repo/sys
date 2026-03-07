import { type t, Args, Is } from './common.ts';

const COMMANDS: ReadonlySet<t.__NAME__Tool.SubCmd> = new Set(['foo', 'bar']);
const ALIAS = {
  foo: ['f'],
  bar: ['b'],
} as const satisfies t.ArgsAliasMap<t.__NAME__Tool.SubCmd>;

export function parseArgs(argv: string[] = []): t.__NAME__Tool.CliParsedArgs {
  const normalized = Args.normalizeCommand(argv, Args.toAliasLookup(ALIAS));

  const args = Args.parse<t.__NAME__Tool.CliArgs>(normalized, {
    alias: { h: 'help' },
    boolean: ['help'],
  });

  const head = args._[0];
  const command = isCommand(head) ? head : undefined;

  return { ...args, command };
}

/**
 * Helpers
 */
function isCommand(x: unknown): x is t.__NAME__Tool.SubCmd {
  return Is.str(x) && COMMANDS.has(x as t.__NAME__Tool.SubCmd);
}
