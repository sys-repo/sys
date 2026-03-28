import { type t, Args, D } from './common.ts';
import { ALIAS } from './registry.ts';

const TOOLSET: ReadonlySet<string> = new Set(D.TOOLS);

/**
 * Parse root argv and extract a typed command from the first positional.
 * Flags do not suppress command detection.
 */
export function parseArgs(argv: string[]): t.Root.CliRootParsedArgs {
  const normalized = Args.normalizeCommand(argv, Args.toAliasLookup(ALIAS));
  const args = Args.parse<t.Root.CliRootArgs>(normalized, {
    alias: { h: 'help' },
    boolean: ['help'],
  });

  const head = args._[0];
  const command = isRootCommand(head) ? head : undefined;

  return { ...args, command };
}

/**
 * Helpers
 */
function isRootCommand(x?: string): x is t.Root.Command {
  return x !== undefined && TOOLSET.has(x);
}
