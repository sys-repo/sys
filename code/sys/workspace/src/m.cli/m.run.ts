import { type t, Err, Fs } from './common.ts';
import { WorkspaceUpgrade } from '../m.upgrade/mod.ts';
import { parseArgs } from './u.args.ts';

export const run: t.WorkspaceCli.Lib['run'] = async (input = {}) => {
  const cwd = input.cwd ?? Fs.cwd('terminal');
  const argv = [...(input.argv ?? [])];
  const options = parseArgs(cwd, argv);

  if (options.mode === 'interactive') {
    throw Err.std('Workspace CLI interactive mode is not implemented yet');
  }

  const upgradeInput = { cwd, deps: options.deps };
  const selection = await wrangle.selection(upgradeInput, options);
  const upgradeOptions = {
    policy: {
      mode: options.policy,
      exclude: selection.exclude.length > 0 ? selection.exclude : undefined,
    },
  } satisfies t.WorkspaceUpgrade.Options;

  if (options.apply) {
    const applied = await WorkspaceUpgrade.apply(upgradeInput, upgradeOptions);
    const upgrade = applied.upgrade;
    return { kind: 'apply', input: { argv, cwd }, options, selection, upgrade, applied };
  }

  const upgrade = await WorkspaceUpgrade.upgrade(upgradeInput, upgradeOptions);
  return { kind: 'plan', input: { argv, cwd }, options, selection, upgrade };
};

/**
 * Helpers:
 */

const wrangle = {
  async selection(
    input: t.WorkspaceUpgrade.Input,
    options: t.WorkspaceCli.ResolvedOptions,
  ): Promise<t.WorkspaceCli.Selection> {
    if (options.include.length === 0) {
      return { include: [], exclude: options.exclude };
    }

    const collected = await WorkspaceUpgrade.collect(input, {
      policy: { mode: options.policy, exclude: options.exclude },
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
