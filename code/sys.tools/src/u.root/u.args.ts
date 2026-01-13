import { type t, Args, D } from './common.ts';

type AliasMap = Partial<Record<t.Tools.Command, string[]>>;

export const ALIAS: AliasMap = { copy: ['cp'], update: ['up'] } as const;
const ALIAS_LOOKUP = toAliasLookup(ALIAS);
const TOOL_SET: ReadonlySet<string> = new Set(D.TOOLS);

/**
 * Parse root argv and extract a typed command from the first positional.
 * Flags do not suppress command detection.
 */
export const parseRootArgs = (argv: string[]): t.Tools.CliRootParsedArgs => {
  const normalized = normalizeCommand(argv);

  const args = Args.parse<t.Tools.CliRootArgs>(normalized, {
    alias: { h: 'help' },
    boolean: ['help'],
  });

  const head = args._[0];
  const command = isRootCommand(head) ? head : undefined;

  return { ...args, command };
};

/**
 * Helpers
 */
function isRootCommand(x?: string): x is t.Tools.Command {
  return x !== undefined && TOOL_SET.has(x);
}

function normalizeCommand(argv: string[]): string[] {
  if (!argv.length) return [...argv];
  const [head, ...rest] = argv;
  const canonical = ALIAS_LOOKUP[head];
  if (!canonical) return [...argv];
  return [canonical, ...rest];
}

function toAliasLookup(map: AliasMap) {
  type T = [t.Tools.Command, string[]][];
  const lookup: Record<string, t.Tools.Command> = {};
  for (const [command, aliases] of Object.entries(map) as T) {
    for (const alias of aliases ?? []) lookup[alias] = command;
  }
  return lookup;
}
