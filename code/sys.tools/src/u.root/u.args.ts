import { type t, Args, D } from './common.ts';

const TOOL_SET: ReadonlySet<string> = new Set(D.TOOLS);

/**
 * Parse root argv and extract a typed command from the first positional.
 * Flags do not suppress command detection.
 */
export const parseRootArgs = (argv: readonly string[]): t.Tools.CliRootParsedArgs => {
  const args = Args.parse<t.Tools.CliRootArgs>([...argv], {
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
function isRootCommand(x: string | undefined): x is t.Tools.Command {
  return x !== undefined && TOOL_SET.has(x);
}
