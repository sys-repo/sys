import { Cli, Err, Fs, Is, type t } from './common.ts';
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

  if (wantsHelp(argv)) {
    const text = FmtHelp.output();
    console.info(text);
    return { kind: 'help', input: { argv, cwd }, text };
  }

  const options = parseArgs(cwd, argv);
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
};

/**
 * Helpers:
 */

async function runDsl(input: { readonly argv: readonly string[]; readonly cwd: t.StringDir }) {
  const { argv, cwd } = input;
  const args = parseDslArgs(argv);
  const format = wrangle.dslFormat(args.format);

  if (args.unknown.length > 0) throw Err.std(`Unknown option for dsl: ${args.unknown.join(', ')}`);
  if (!format.ok) throw Err.std(format.message);

  const text = await FmtHelp.dslOutput({ path: args._.map(String), format: format.value });
  console.info(text);
  return { kind: 'help', input: { argv, cwd }, text } as const;
}

const wrangle = {
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
