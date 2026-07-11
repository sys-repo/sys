import { Args as StdArgs, Err, Is, Num, type t } from '../common.ts';

type ParsedTestArgs = {
  readonly parallel?: boolean | readonly boolean[];
  readonly jobs?: string | boolean | readonly (string | boolean)[];
};

/** Typed argument helpers for workspace task runners. */
export const Args: t.WorkspaceRun.Args.Lib = {
  test: parseTestArgs,
};

/** Parse CLI argv into canonical test-runner arguments. */
export function parseTestArgs(argv: readonly string[] = []): t.WorkspaceRun.Test.Args {
  const normalized = wrangle.argv(argv);
  wrangle.valuedBoolean(normalized, 'parallel');

  const unknown: string[] = [];
  const args = StdArgs.parse<ParsedTestArgs>(normalized, {
    boolean: ['parallel'],
    string: ['jobs'],
    unknown(flag) {
      unknown.push(flag);
      return false;
    },
  });

  if (unknown.length > 0) {
    throw Err.std(`Workspace.Run.test: unknown flag: ${unknown.join(', ')}`);
  }
  if (args._.length > 0) {
    throw Err.std(`Workspace.Run.test: unexpected argument: ${args._.join(', ')}`);
  }

  const parallel = wrangle.boolean(args.parallel, 'parallel');
  const jobs = wrangle.jobs(args.jobs);

  if (jobs !== undefined && !parallel) {
    throw Err.std('Workspace.Run.test: --jobs requires --parallel');
  }
  if (!parallel) return {};

  return jobs === undefined
    ? { strategy: { kind: 'parallel' } }
    : { strategy: { kind: 'parallel', jobs } };
}

const wrangle = {
  argv(input: readonly string[]): string[] {
    return input.filter((value, index) => !(value === '--' && index === 0));
  },

  valuedBoolean(argv: readonly string[], name: string) {
    const prefix = `--${name}=`;
    for (const token of argv) {
      if (!token.startsWith(prefix)) continue;
      const value = token.slice(prefix.length);
      if (value === 'true' || value === 'false') continue;
      throw Err.std(
        `Workspace.Run.test: --${name} must be true or false when a value is provided (${token})`,
      );
    }
  },

  boolean(input: ParsedTestArgs['parallel'], name: string): boolean {
    if (input === undefined) return false;
    if (Is.array(input)) throw Err.std(`Workspace.Run.test: duplicate --${name} flag`);
    if (input === true) return true;
    if (input === false) return false;
    throw Err.std(`Workspace.Run.test: invalid --${name} flag`);
  },

  jobs(input: ParsedTestArgs['jobs']): t.WorkspaceRun.Test.Strategy.Jobs | undefined {
    if (input === undefined) return undefined;
    if (Is.array(input)) throw Err.std('Workspace.Run.test: duplicate --jobs flag');
    if (!Is.str(input)) throw Err.std('Workspace.Run.test: --jobs requires a value');

    const value = input.trim();
    if (value === 'auto') return 'auto';
    if (!/^\d+$/.test(value)) {
      throw Err.std(`Workspace.Run.test: --jobs must be auto or a positive integer (${input})`);
    }

    const jobs = Number(value);
    if (!Num.Is.safeInt(jobs) || jobs < 1) {
      throw Err.std(`Workspace.Run.test: --jobs must be auto or a positive integer (${input})`);
    }
    return jobs;
  },
} as const;
