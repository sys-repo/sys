import { Args, Err, Is, Path, type t } from '../common.ts';

export function commandOf(argv: readonly string[]): string | undefined {
  const first = wrangle.argv(argv)[0];
  return Is.str(first) && !first.startsWith('-') ? first : undefined;
}

export function wantsHelp(argv: readonly string[]): boolean {
  const args = Args.parse<t.WorkspaceCli.ParsedArgs>(wrangle.argv(argv), {
    boolean: ['help'],
    alias: { h: 'help' },
  });
  return args.help === true;
}

export function parseArgs(
  cwd: t.StringDir,
  argv: readonly string[],
): t.WorkspaceCli.ResolvedOptions {
  const args = Args.parse<t.WorkspaceCli.ParsedArgs>(wrangle.argv(argv), {
    boolean: ['dry-run', 'help', 'prerelease', 'non-interactive'],
    string: ['policy', 'deps', 'include', 'exclude'],
    alias: { h: 'help' },
  });

  return {
    deps: Path.resolve(cwd, wrangle.one(args.deps) ?? 'deps.yaml'),
    mode: args['non-interactive'] === true ? 'non-interactive' : 'interactive',
    policy: wrangle.policy(args.policy),
    prerelease: args.prerelease === true,
    include: wrangle.list(args.include),
    exclude: wrangle.list(args.exclude),
    dryRun: args['dry-run'] === true,
  };
}

export function parseDslArgs(argv: readonly string[]): t.WorkspaceCli.ParsedDslArgs {
  const unknown: string[] = [];
  const args = Args.parse<{
    help?: boolean;
    format?: string | boolean | (string | boolean)[];
  }>(wrangle.commandArgs(argv, 'dsl'), {
    boolean: ['help'],
    string: ['format'],
    alias: { h: 'help' },
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

const wrangle = {
  policy(input: unknown): t.EsmPolicy.Mode {
    const mode = wrangle.one(input);
    if (mode === undefined || mode === '') return 'minor';
    if (mode === 'none' || mode === 'patch' || mode === 'minor' || mode === 'latest') return mode;
    throw Err.std(`Unsupported workspace upgrade policy mode: ${mode}`);
  },

  one(input: unknown): string | undefined {
    if (Is.str(input)) return input;
    if (Array.isArray(input) && Is.str(input[0])) return input[0];
    return undefined;
  },

  list(input: unknown): readonly string[] {
    const raw = Is.str(input) ? [input] : Array.isArray(input) ? input.filter(Is.str) : [];
    const flat = raw.flatMap((item) =>
      item
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    );
    return [...new Set(flat)].sort((a, b) => a.localeCompare(b));
  },

  commandArgs(input: readonly string[], command: string): string[] {
    const argv = wrangle.argv(input);
    return argv[0] === command ? argv.slice(1) : argv;
  },

  argv(input: readonly string[]): string[] {
    return input.filter((value, index) => !(value === '--' && index === 0));
  },
} as const;
