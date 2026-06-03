import { Args as StdArgs, Fs, Is, type t } from '../common.ts';

export const Args: t.WorkspaceBump.Args.Lib = {
  parse(argv = Deno.args) {
    const normalized = argv.filter((item) => item !== '--');
    const args = StdArgs.parse<{
      help?: boolean;
      from?: string | string[] | boolean;
      since?: string | string[] | boolean;
      release?: string | boolean;
      'dry-run'?: boolean;
      'non-interactive'?: boolean;
      'explain-delta'?: boolean;
    }>([...normalized], {
      boolean: ['help', 'dry-run', 'non-interactive', 'explain-delta'],
      alias: { h: ['help'] },
    });

    return {
      help: args.help,
      from: wrangle.roots(args.from, args._),
      since: wrangle.since(args.since),
      release: wrangle.release(args.release),
      dryRun: args['dry-run'] ?? false,
      nonInteractive: args['non-interactive'] ?? false,
      explainDelta: args['explain-delta'] ?? false,
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
    const from = input.options?.from ?? args.from;
    const since = input.options?.since ?? args.since;
    const explainDelta = input.options?.explainDelta ?? args.explainDelta;
    return {
      help: args.help ?? false,
      invalidRelease: args.release !== undefined && release === undefined
        ? args.release
        : undefined,
      since,
      explainDelta,
      conflict: wrangle.conflict({ help: args.help ?? false, from, since, explainDelta }),
      run: {
        cwd: input.options?.cwd ?? Fs.cwd(),
        release: input.options?.release ?? release ?? 'patch',
        from,
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
  release(input?: string | boolean) {
    return Is.str(input) ? input : undefined;
  },

  from(input?: string | string[] | boolean) {
    if (input === undefined || input === false) return [];
    if (input === true) return [''];
    return Is.str(input) ? [input] : [...input];
  },

  roots(input: string | string[] | boolean | undefined, positionals: readonly string[]) {
    const roots = [...wrangle.from(input), ...positionals];
    return roots.length === 0 ? undefined : roots;
  },

  since(input?: string | string[] | boolean) {
    if (input === undefined || input === false) return undefined;
    if (input === true) return '';
    return Is.str(input) ? input : input.at(-1);
  },

  conflict(args: {
    readonly help: boolean;
    readonly from?: readonly string[];
    readonly since?: string;
    readonly explainDelta: boolean;
  }): t.WorkspaceBump.Args.Conflict | undefined {
    if (args.help) return undefined;
    if (args.since !== undefined && args.from && args.from.length > 0) {
      return {
        code: 'since-and-from',
        message: '--since cannot be used with --from.',
      };
    }
    if (args.explainDelta && args.since === undefined) {
      return {
        code: 'explain-delta-without-since',
        message: '--explain-delta requires --since.',
      };
    }
    return undefined;
  },
} as const;
