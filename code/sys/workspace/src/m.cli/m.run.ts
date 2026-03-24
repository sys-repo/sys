import { type t, Fs } from './common.ts';
import { WorkspaceUpgrade } from '../m.upgrade/mod.ts';
import { parseArgs, wantsHelp } from './u.args.ts';
import { Fmt } from './u.fmt.ts';
import { FmtHelp } from './u.fmt.help.ts';
import { runInteractive } from './u.interactive.ts';

export const run: t.WorkspaceCli.Lib['run'] = async (input = {}) => {
  const cwd = input.cwd ?? Fs.cwd('terminal');
  const argv = [...(input.argv ?? [])];
  if (wantsHelp(argv)) {
    const text = FmtHelp.output();
    console.info(text);
    console.info();
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
  const upgradeOptions = wrangle.upgradeOptions(options, selection.exclude);

  if (options.apply) {
    const applied = await WorkspaceUpgrade.apply(upgradeInput, upgradeOptions);
    const upgrade = applied.upgrade;
    console.info(Fmt.applied(applied));
    console.info();
    return { kind: 'apply', input: { argv, cwd }, options, selection, upgrade, applied };
  }

  const upgrade = await WorkspaceUpgrade.upgrade(upgradeInput, upgradeOptions);
  console.info(Fmt.plan(upgrade));
  console.info();
  return { kind: 'plan', input: { argv, cwd }, options, selection, upgrade };
};

/**
 * Helpers:
 */

const wrangle = {
  upgradeOptions(
    options: t.WorkspaceCli.ResolvedOptions,
    exclude: readonly string[],
  ): t.WorkspaceUpgrade.Options {
    return {
      policy: {
        mode: options.policy,
        exclude: exclude.length > 0 ? exclude : undefined,
      },
      prerelease: options.prerelease,
    };
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
