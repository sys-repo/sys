import { type t, Args, Is } from './common.ts';

const COMMANDS: ReadonlySet<t.CryptoTool.SubCmd> = new Set(['hash']);
const ALIAS = {
  hash: ['hx'],
} as const satisfies t.ArgsAliasMap<t.CryptoTool.SubCmd>;

export function parseArgs(argv: string[] = []): t.CryptoTool.CliParsedArgs {
  const normalized = Args.normalizeCommand(argv, Args.toAliasLookup(ALIAS));

  const args = Args.parse<t.CryptoTool.CliArgs>(normalized, {
    alias: { h: 'help' },
    boolean: ['help', 'save'],
  });

  const head = args._[0];
  const command = isCommand(head) ? head : undefined;

  return { ...args, command };
}

/**
 * Helpers
 */
function isCommand(x: unknown): x is t.CryptoTool.SubCmd {
  return Is.str(x) && COMMANDS.has(x as t.CryptoTool.SubCmd);
}
