import { Cli, Err, Fs, Is, type t } from './common.ts';
import { WorkspaceBump } from '../m.bump/mod.ts';
import { WorkspaceDelta } from '../m.delta/mod.ts';
import { WorkspaceUpgrade } from '../m.upgrade/mod.ts';
import { commandOf, parseArgs, parseDslArgs, wantsHelp } from './u/u.args.ts';
import { runInteractive } from './u/u.interactive.ts';
import { Fmt } from './u.fmt/u.fmt.ts';
import { FmtHelp } from './u.fmt/u.fmt.help.ts';

export const run: t.WorkspaceCli.Lib['run'] = async (input = {}) => {
  const cwd = input.cwd ?? Fs.cwd('process');
  const argv = [...(input.argv ?? [])];
  const command = commandOf(argv);

  if (command === 'dsl') return await runDsl({ argv, cwd });
  if (command === 'bump') return await runBump({ argv, cwd, policy: input.bumpPolicy });
  if (command === 'upgrade') return await runUpgrade({ argv, cwd });

  if (argv.length === 0 || wantsHelp(argv)) {
    const text = FmtHelp.output();
    console.info(text);
    return { kind: 'help', input: { argv, cwd }, text };
  }

  throw Err.std(`Unknown command: ${command}`);
};

/**
 * Helpers:
 */

async function runUpgrade(input: {
  readonly argv: readonly string[];
  readonly cwd: t.StringDir;
}): Promise<t.WorkspaceCli.Result> {
  const { argv, cwd } = input;
  const upgradeArgv = wrangle.commandArgs(argv, 'upgrade');
  if (wantsHelp(upgradeArgv)) {
    const text = FmtHelp.upgradeOutput();
    console.info(text);
    return { kind: 'help', input: { argv, cwd }, text } as const;
  }

  const options = parseArgs(cwd, upgradeArgv);
  const upgradeInput = { cwd, deps: options.deps };

  if (options.mode === 'interactive') {
    const res = await runInteractive(upgradeInput, options);
    if (res.applied) {
      return {
        kind: 'apply',
        input: { argv, cwd },
        options,
        selection: res.selection,
        upgrade: res.applied.upgrade,
        applied: res.applied,
      };
    }

    return {
      kind: 'plan',
      input: { argv, cwd },
      options,
      selection: res.selection,
      upgrade: res.upgrade,
    };
  }

  const selection = await wrangle.selection(upgradeInput, options);

  const upgrade = await Cli.Spinner.with(
    Fmt.spinnerProgress({ kind: 'plan' }),
    (spinner) =>
      WorkspaceUpgrade.upgrade(
        upgradeInput,
        wrangle.upgradeOptions(options, selection.exclude, (progress) =>
          spinner.start(Fmt.spinnerProgress(progress))),
      ),
  );
  if (options.dryRun) {
    console.info(Fmt.plan(upgrade));
    console.info();
    return { kind: 'plan', input: { argv, cwd }, options, selection, upgrade };
  }

  const applied = await Cli.Spinner.with(
    Fmt.spinnerProgress({ kind: 'apply' }),
    (spinner) =>
      WorkspaceUpgrade.apply(
        upgradeInput,
        wrangle.upgradeOptions(options, selection.exclude, (progress) =>
          spinner.start(Fmt.spinnerProgress(progress))),
      ),
  );

  console.info(Fmt.applied(applied));
  const commit = Fmt.commitSuggestion(applied);
  if (commit) {
    console.info();
    console.info(commit);
  }
  console.info();
  return {
    kind: 'apply',
    input: { argv, cwd },
    options,
    selection,
    upgrade: applied.upgrade,
    applied,
  };
}

async function runBump(input: {
  readonly argv: readonly string[];
  readonly cwd: t.StringDir;
  readonly policy?: t.WorkspaceBump.Policy;
}): Promise<t.WorkspaceCli.Result> {
  const { argv, cwd, policy } = input;
  const bumpArgv = wrangle.commandArgs(argv, 'bump');
  const args = WorkspaceBump.Args.run({ argv: bumpArgv, options: { cwd }, policy });

  if (args.help) {
    const text = WorkspaceBump.Fmt.help('@sys/workspace bump');
    return { kind: 'help', input: { argv, cwd }, text } as const;
  }
  if (args.conflict) throw Err.std(args.conflict.message);
  if (args.invalidRelease) console.warn(WorkspaceBump.Fmt.invalidRelease(args.invalidRelease));

  const bump = args.since === undefined
    ? await WorkspaceBump.run(args.run)
    : await wrangle.runSinceBump(args, cwd);

  return { kind: 'bump', input: { argv, cwd }, bump } as const;
}

async function runDsl(input: {
  readonly argv: readonly string[];
  readonly cwd: t.StringDir;
}): Promise<t.WorkspaceCli.Result> {
  const { argv, cwd } = input;
  const args = parseDslArgs(argv);
  if (args.help) {
    const text = await FmtHelp.dslOutput({ path: args._.map(String), format: 'human' });
    console.info(text);
    return { kind: 'help', input: { argv, cwd }, text } as const;
  }

  const format = wrangle.dslFormat(args.format);

  if (args.unknown.length > 0) throw Err.std(`Unknown option for dsl: ${args.unknown.join(', ')}`);
  if (!format.ok) throw Err.std(format.message);

  const text = await FmtHelp.dslOutput({ path: args._.map(String), format: format.value });
  console.info(text);
  return { kind: 'help', input: { argv, cwd }, text } as const;
}

const wrangle = {
  commandArgs(input: readonly string[], command: string): string[] {
    const argv = input[0] === '--' ? input.slice(1) : input;
    return argv[0] === command ? argv.slice(1) : [...argv];
  },

  async runSinceBump(
    args: t.WorkspaceBump.Args.RunResolved,
    cwd: t.StringDir,
  ): Promise<t.WorkspaceBump.RunResult> {
    const delta = await WorkspaceDelta.Git.fromRef({
      cwd,
      ref: args.since ?? '',
      release: args.run.release,
      policy: args.run.policy,
    });
    wrangle.printDelta(delta);
    return await WorkspaceBump.run({
      ...args.run,
      collect: delta.collect,
      from: delta.bumpRootPkgPaths,
    });
  },

  printDelta(delta: t.WorkspaceDelta.Git.FromRefResult) {
    console.info();
    console.info(`Delta since ${delta.ref}..${delta.head}`);
    console.info(`  changed         ${wrangle.formatList(delta.changedPkgPaths)}`);
    console.info(`  needs bump      ${wrangle.formatList(delta.needsBumpPkgPaths)}`);
    console.info(`  already bumped  ${wrangle.formatList(delta.alreadyBumpedPkgPaths)}`);
    console.info(`  new packages    ${wrangle.formatList(delta.newPkgPaths)}`);
    console.info();
  },

  formatList(paths: readonly string[]) {
    return paths.length === 0 ? '0' : `${paths.length} (${paths.join(', ')})`;
  },

  upgradeOptions(
    options: t.WorkspaceCli.ResolvedOptions,
    exclude: readonly string[],
    progress?: t.WorkspaceUpgrade.ProgressHandler,
  ): t.WorkspaceUpgrade.Options {
    return {
      policy: {
        mode: options.policy,
        exclude: exclude.length > 0 ? exclude : undefined,
      },
      prerelease: options.prerelease,
      progress,
    };
  },

  dslFormat(
    value: t.WorkspaceCli.ParsedDslArgs['format'],
  ):
    | { readonly ok: true; readonly value: t.WorkspaceCli.Dsl.Format }
    | { readonly ok: false; readonly message: string } {
    if (value === undefined) return { ok: true, value: 'human' };
    if (Is.array<string | boolean>(value)) {
      return { ok: false, message: 'Repeated option for dsl: --format' };
    }
    if (!Is.str(value)) return { ok: false, message: 'Option requires a value: --format' };
    if (value === 'human' || value === 'skill') return { ok: true, value };
    return { ok: false, message: `Unsupported dsl format: ${value} (expected: human, skill)` };
  },

  async selection(
    input: t.WorkspaceUpgrade.Input,
    options: t.WorkspaceCli.ResolvedOptions,
  ): Promise<t.WorkspaceCli.Selection> {
    if (options.include.length === 0) {
      return { include: [], exclude: options.exclude };
    }

    const collected = await WorkspaceUpgrade.collect(input, {
      policy: { mode: options.policy, exclude: options.exclude },
      prerelease: options.prerelease,
    });

    const include = options.include;
    const exclude = new Set(options.exclude);

    for (const candidate of collected.candidates) {
      const alias = candidate.entry.module.alias;
      const name = candidate.entry.module.name;
      const picked = include.includes(name) || (!!alias && include.includes(alias));
      if (!picked) exclude.add(name);
    }

    return {
      include,
      exclude: [...exclude].sort((a, b) => a.localeCompare(b)),
    };
  },
} as const;
