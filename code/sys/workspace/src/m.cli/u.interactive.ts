import { type t, Cli, c } from './common.ts';
import { WorkspaceUpgrade } from '../m.upgrade/mod.ts';
import { Fmt } from './u.fmt.ts';

type InteractiveResult = {
  readonly selection: t.WorkspaceCli.Selection;
  readonly upgrade: t.WorkspaceUpgrade.Result;
  readonly applied?: t.WorkspaceUpgrade.ApplyResult;
};

export async function runInteractive(
  input: t.WorkspaceUpgrade.Input,
  options: t.WorkspaceCli.ResolvedOptions,
): Promise<InteractiveResult> {
  const initial = await withSpinner('planning workspace upgrades...', () =>
    WorkspaceUpgrade.upgrade(input, wrangle.upgradeOptions(options.policy, options.exclude)),
  );

  console.info();
  console.info(Fmt.plan(initial));
  console.info();

  const selection = await wrangle.selection(initial, options);
  const policy = wrangle.policy(initial, selection, options.policy);
  if (policy !== options.policy) {
    console.info(Fmt.overrideNotice(options.policy));
    console.info();
  }
  const upgrade =
    policy === options.policy && wrangle.sameExclude(selection.exclude, options.exclude)
      ? initial
      : await withSpinner('re-planning selected workspace upgrades...', () =>
          WorkspaceUpgrade.upgrade(input, wrangle.upgradeOptions(policy, selection.exclude)),
        );

  console.info(Fmt.selected(selection));
  console.info();

  if (!options.apply) {
    console.info(Fmt.plan(upgrade));
    console.info();
    return { selection, upgrade };
  }
  if (upgrade.totals.planned === 0) return { selection, upgrade };

  const applied = await withSpinner('applying workspace upgrades...', () =>
    WorkspaceUpgrade.apply(input, wrangle.upgradeOptions(policy, selection.exclude)),
  );
  console.info(Fmt.applied(applied));
  console.info();

  return { selection, upgrade: applied.upgrade, applied };
}

async function withSpinner<T>(message: string, fn: () => Promise<T>): Promise<T> {
  const spinner = Cli.spinner(c.gray(message)).start();
  try {
    return await fn();
  } finally {
    spinner.stop();
  }
}

const wrangle = {
  upgradeOptions(
    mode: t.EsmPolicyMode,
    exclude: readonly string[],
  ): t.WorkspaceUpgrade.Options {
    return {
      policy: {
        mode,
        exclude: exclude.length > 0 ? exclude : undefined,
      },
    };
  },

  policy(
    upgrade: t.WorkspaceUpgrade.Result,
    selection: t.WorkspaceCli.Selection,
    mode: t.EsmPolicyMode,
  ): t.EsmPolicyMode {
    const picked = new Set(selection.include);
    const blockedSelected = upgrade.policy.decisions.some((decision) => {
      if (decision.ok) return false;
      return picked.has(decision.input.subject.entry.module.name);
    });
    return blockedSelected ? 'latest' : mode;
  },

  async selection(
    upgrade: t.WorkspaceUpgrade.Result,
    options: t.WorkspaceCli.ResolvedOptions,
  ): Promise<t.WorkspaceCli.Selection> {
    const promptOptions = Fmt.selectionOptions(upgrade, options);
    if (promptOptions.length === 0) return { include: [], exclude: options.exclude };

    const picked =
      (await Cli.Input.Checkbox.prompt<string>({
        message: 'Dependencies to upgrade',
        options: [...promptOptions],
        maxRows: 12,
      })) ?? [];

    const pickedSet = new Set(picked);
    const exclude = new Set(options.exclude);

    for (const option of promptOptions) {
      if (option.disabled) continue;
      if (!pickedSet.has(option.value)) exclude.add(option.value);
    }

    return {
      include: [...pickedSet].sort((a, b) => a.localeCompare(b)),
      exclude: [...exclude].sort((a, b) => a.localeCompare(b)),
    };
  },

  sameExclude(a: readonly string[], b: readonly string[]): boolean {
    if (a.length !== b.length) return false;
    return a.every((item, index) => item === b[index]);
  },
} as const;
