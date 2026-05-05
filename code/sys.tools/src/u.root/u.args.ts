import { Args, D, type t } from './common.ts';
import { ALIAS } from './registry.ts';
import { RootUpdateAdvisoryPolicy } from './u.updateAdvisory.policy.ts';

const TOOLSET: ReadonlySet<string> = new Set(D.TOOLS);
const ROOT_ONLY_FLAGS: ReadonlySet<string> = new Set([
  RootUpdateAdvisoryPolicy.flag.noUpdateCheck,
]);

/**
 * Parse root argv and extract a typed command from the first positional.
 * Flags do not suppress command detection.
 */
export function parseArgs(argv: string[]): t.Root.CliRootParsedArgs {
  const args = Args.parse<t.Root.CliRootArgs>(argv, {
    alias: { h: 'help' },
    boolean: ['help', RootUpdateAdvisoryPolicy.flag.noUpdateCheckKey],
  });
  const positionals = wrangle.normalizePositionals(args._);
  const head = positionals[0];
  const command = isRootCommand(head) ? head : undefined;

  return {
    ...args,
    _: positionals,
    command,
    noUpdateCheck: args[RootUpdateAdvisoryPolicy.flag.noUpdateCheckKey] === true,
  };
}

/** Create the argv vector expected by the selected child tool. */
export function toRootDispatchArgv(
  argv: readonly string[],
  args: t.Root.CliRootParsedArgs,
): readonly string[] {
  if (!args.command) return argv;

  const cleaned = wrangle.stripRootOnlyFlags(argv);
  const commandIndex = cleaned.findIndex((item) => wrangle.canonicalCommand(item) === args.command);
  if (commandIndex < 0) return [args.command];

  return [
    args.command,
    ...cleaned.slice(0, commandIndex),
    ...cleaned.slice(commandIndex + 1),
  ];
}

/**
 * Helpers
 */
function isRootCommand(x?: string): x is t.Root.Command {
  return x !== undefined && TOOLSET.has(x);
}

const wrangle = {
  aliasLookup: Args.toAliasLookup(ALIAS),

  canonicalCommand(value: string): string {
    return wrangle.aliasLookup[value] ?? value;
  },

  normalizePositionals(positionals: readonly string[]): string[] {
    if (!positionals.length) return [];
    const [head, ...rest] = positionals;
    return [wrangle.canonicalCommand(head), ...rest];
  },

  stripRootOnlyFlags(argv: readonly string[]): string[] {
    const next: string[] = [];
    let positionalOnly = false;

    for (const arg of argv) {
      if (positionalOnly) {
        next.push(arg);
        continue;
      }
      if (arg === '--') {
        positionalOnly = true;
        next.push(arg);
        continue;
      }
      if (wrangle.isRootOnlyFlag(arg)) continue;
      next.push(arg);
    }

    return next;
  },

  isRootOnlyFlag(arg: string): boolean {
    const [name] = arg.split('=', 1);
    return ROOT_ONLY_FLAGS.has(name);
  },
} as const;
