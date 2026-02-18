import { type t, Args, Is } from './common.ts';

const COMMANDS: ReadonlySet<t.PullTool.SubCmd> = new Set(['foo', 'bar']);
const ALIAS = {
  foo: ['f'],
  bar: ['b'],
} as const satisfies t.ArgsAliasMap<t.PullTool.SubCmd>;

export function parseArgs(argv: string[] = []): t.PullTool.CliParsedArgs {
  const normalized = Args.normalizeCommand(argv, Args.toAliasLookup(ALIAS));

  const args = Args.parse<t.PullTool.CliArgs>(normalized, {
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
function isCommand(x: unknown): x is t.PullTool.SubCmd {
  return Is.str(x) && COMMANDS.has(x as t.PullTool.SubCmd);
}
