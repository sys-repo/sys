import { Cli, type t } from '../common.ts';
import { applyWithSession } from '../../m.upgrade/u.apply.ts';
import { createSession, type UpgradeSession } from '../../m.upgrade/u.session.ts';
import { upgradeWithSession } from '../../m.upgrade/u.upgrade.ts';
import { Fmt } from '../u.fmt/u.fmt.ts';
import { UpgradeSelection } from './u.selection.ts';

type InteractiveResult = {
  readonly selection: t.WorkspaceCli.Selection;
  readonly upgrade: t.WorkspaceUpgrade.Result;
  readonly applied?: t.WorkspaceUpgrade.ApplyResult;
};

export type InteractiveDependencies = {
  readonly createSession: () => UpgradeSession;
  readonly promptCheckbox: typeof Cli.Input.Checkbox.prompt<string>;
};

const DEFAULT_DEPS: InteractiveDependencies = {
  createSession,
  promptCheckbox: Cli.Input.Checkbox.prompt,
};

export async function runInteractive(
  input: t.WorkspaceUpgrade.Input,
  options: t.WorkspaceCli.ResolvedOptions,
): Promise<InteractiveResult> {
  return await runInteractiveWith(DEFAULT_DEPS, input, options);
}

/** Package-internal dependency seam for one interactive upgrade session. */
export async function runInteractiveWith(
  deps: InteractiveDependencies,
  input: t.WorkspaceUpgrade.Input,
  options: t.WorkspaceCli.ResolvedOptions,
): Promise<InteractiveResult> {
  const entries = await UpgradeSelection.interactive(input);
  const session = deps.createSession();
  const initial = await Cli.Spinner.with(
    Fmt.spinnerProgress({ kind: 'plan' }),
    (spinner) =>
      upgradeWithSession(
        input,
        wrangle.upgradeOptions(
          options.policy,
          options.exclude,
          options.prerelease,
          options.minimumDependencyAge,
          options.evaluatedAt,
          (progress) => spinner.start(Fmt.spinnerProgress(progress)),
        ),
        session,
      ),
  );

  console.info();
  console.info(Fmt.plan(initial));
  console.info();

  const selection = await wrangle.selection(deps, initial, options, entries);
  const policy = wrangle.policy(initial, selection, options.policy);
  if (policy !== options.policy) {
    console.info(Fmt.overrideNotice(options.policy));
  }
  const upgrade =
    policy === options.policy && wrangle.sameExclude(selection.exclude, options.exclude)
      ? initial
      : await Cli.Spinner.with(
        Fmt.spinnerProgress({ kind: 'plan' }),
        (spinner) =>
          upgradeWithSession(
            input,
            wrangle.upgradeOptions(
              policy,
              selection.exclude,
              options.prerelease,
              options.minimumDependencyAge,
              options.evaluatedAt,
              (progress) => spinner.start(Fmt.spinnerProgress(progress)),
            ),
            session,
          ),
      );

  console.info(Fmt.selected(selection));

  if (options.dryRun) {
    console.info();
    console.info(Fmt.plan(upgrade));
    console.info();
    return { selection, upgrade };
  }
  if (upgrade.totals.planned === 0) return { selection, upgrade };

  const applied = await Cli.Spinner.with(
    Fmt.spinnerProgress({ kind: 'apply' }),
    (spinner) =>
      applyWithSession(
        input,
        wrangle.upgradeOptions(
          policy,
          selection.exclude,
          options.prerelease,
          options.minimumDependencyAge,
          options.evaluatedAt,
          (progress) => spinner.start(Fmt.spinnerProgress(progress)),
        ),
        session,
      ),
  );
  console.info(Fmt.applied(applied));
  const commit = Fmt.commitSuggestion(applied);
  if (commit) {
    console.info();
    console.info(commit);
  }
  console.info();

  return { selection, upgrade: applied.upgrade, applied };
}

const wrangle = {
  upgradeOptions(
    mode: t.EsmPolicy.Mode,
    exclude: readonly string[],
    prerelease: boolean,
    minimumDependencyAge: t.Msecs,
    evaluatedAt: t.UnixTimestamp,
    progress?: t.WorkspaceUpgrade.ProgressHandler,
  ): t.WorkspaceUpgrade.Options {
    return {
      policy: {
        mode,
        exclude: exclude.length > 0 ? exclude : undefined,
      },
      prerelease,
      minimumDependencyAge,
      evaluatedAt,
      progress,
    };
  },

  policy(
    upgrade: t.WorkspaceUpgrade.Result,
    selection: t.WorkspaceCli.Selection,
    mode: t.EsmPolicy.Mode,
  ): t.EsmPolicy.Mode {
    const picked = new Set(selection.include);
    const blockedSelected = upgrade.policy.decisions.some((decision) => {
      if (decision.ok) return false;
      return picked.has(decision.input.subject.entry.module.name);
    });
    return blockedSelected ? 'latest' : mode;
  },

  async selection(
    deps: InteractiveDependencies,
    upgrade: t.WorkspaceUpgrade.Result,
    options: t.WorkspaceCli.ResolvedOptions,
    entries: readonly t.EsmDeps.Entry[],
  ): Promise<t.WorkspaceCli.Selection> {
    const promptOptions = Fmt.selectionOptions(upgrade, options);
    if (promptOptions.length === 0) return { include: [], exclude: options.exclude };

    const rawPicked = (await deps.promptCheckbox({
      message: `Dependencies to upgrade (${promptOptions.length.toLocaleString()})`,
      options: [...promptOptions],
      maxRows: Math.min(50, promptOptions.length),
    })) ?? [];
    const enabled = new Set(
      promptOptions.filter((option) => !option.disabled).map((option) => option.value),
    );
    const picked = [...new Set(rawPicked.filter((value) => enabled.has(value)))].toSorted();
    return {
      include: picked,
      exclude: UpgradeSelection.exclusions(entries, picked, options.exclude),
    };
  },

  sameExclude(a: readonly string[], b: readonly string[]): boolean {
    if (a.length !== b.length) return false;
    return a.every((item, index) => item === b[index]);
  },
} as const;
