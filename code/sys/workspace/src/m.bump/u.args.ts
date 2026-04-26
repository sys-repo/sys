import { Args as StdArgs, Fs, Is, type t } from './common.ts';

export const Args: t.WorkspaceBump.Args.Lib = {
  parse(argv = Deno.args) {
    const normalized = argv[0] === '--' ? argv.slice(1) : argv;
    const args = StdArgs.parse<{
      help?: boolean;
      from?: string | string[];
      release?: string;
      'dry-run'?: boolean;
      'non-interactive'?: boolean;
    }>([...normalized], {
      boolean: ['help', 'dry-run', 'non-interactive'],
      alias: { h: ['help'] },
    });

    return {
      help: args.help,
      from: wrangle.from(args.from),
      release: args.release,
      dryRun: args['dry-run'] ?? false,
      nonInteractive: args['non-interactive'] ?? false,
    };
  },

  release(input?: string) {
    if (!input) return undefined;
    const normalized = input.toLowerCase() as t.SemverReleaseType;
    const supported: t.SemverReleaseType[] = ['major', 'minor', 'patch'];
    return supported.includes(normalized) ? normalized : undefined;
  },

  run(input: t.WorkspaceBump.Args.RunInput = {}) {
    const args = Args.parse(input.argv);
    const release = Args.release(args.release);
    return {
      help: args.help ?? false,
      invalidRelease: args.release !== undefined && release === undefined
        ? args.release
        : undefined,
      run: {
        cwd: input.options?.cwd ?? Fs.cwd(),
        release: input.options?.release ?? release ?? 'patch',
        from: input.options?.from ?? args.from,
        dryRun: input.options?.dryRun ?? args.dryRun,
        nonInteractive: input.options?.nonInteractive ?? args.nonInteractive,
        policy: input.policy,
      },
    };
  },
};

/**
 * Helpers:
 */
const wrangle = {
  from(input?: string | string[]) {
    if (input === undefined) return undefined;
    return Is.str(input) ? [input] : [...input];
  },
} as const;
