import { type t, Cli, c } from './common.ts';
import { applyWithSession } from '../m.upgrade/u.apply.ts';
import { createSession } from '../m.upgrade/u.session.ts';
import { upgradeWithSession } from '../m.upgrade/u.upgrade.ts';
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
  const session = createSession();
  console.info();
  const initial = await withSpinner(Fmt.spinnerText('planning workspace upgrades...'), (spinner) =>
    upgradeWithSession(
      input,
      wrangle.upgradeOptions(options.policy, options.exclude, options.prerelease, (progress) =>
        spinner.start(Fmt.spinnerText(wrangle.progressText(progress))),
      ),
      session,
    ),
  );

  console.info();
  console.info(Fmt.plan(initial));
  console.info();

  const selection = await wrangle.selection(initial, options);
  const policy = wrangle.policy(initial, selection, options.policy);
  if (policy !== options.policy) {
    console.info(Fmt.overrideNotice(options.policy));
  }
  const upgrade =
    policy === options.policy && wrangle.sameExclude(selection.exclude, options.exclude)
      ? initial
      : await withSpinnerWithGap(Fmt.spinnerText('re-planning selected workspace upgrades...'), (spinner) =>
          upgradeWithSession(
            input,
            wrangle.upgradeOptions(policy, selection.exclude, options.prerelease, (progress) =>
              spinner.start(Fmt.spinnerText(wrangle.progressText(progress))),
            ),
            session,
          ),
        );

  console.info(Fmt.selected(selection));

  if (!options.apply) {
    console.info();
    console.info(Fmt.plan(upgrade));
    console.info();
    return { selection, upgrade };
  }
  if (upgrade.totals.planned === 0) return { selection, upgrade };

  const applied = await withSpinnerWithGap(Fmt.spinnerText('applying workspace upgrades...'), (spinner) =>
    applyWithSession(
      input,
      wrangle.upgradeOptions(policy, selection.exclude, options.prerelease, (progress) =>
        spinner.start(Fmt.spinnerText(wrangle.progressText(progress))),
      ),
      session,
    ),
  );
  console.info(Fmt.applied(applied));
  console.info();

  return { selection, upgrade: applied.upgrade, applied };
}

async function withSpinner<T>(
  message: string,
  fn: (spinner: t.CliSpinner.Instance) => Promise<T>,
): Promise<T> {
  const spinner = Cli.spinner(message);
  try {
    return await fn(spinner);
  } finally {
    spinner.stop();
  }
}

async function withSpinnerWithGap<T>(
  message: string,
  fn: (spinner: t.CliSpinner.Instance) => Promise<T>,
): Promise<T> {
  console.info();
  return withSpinner(message, fn);
}

const wrangle = {
  upgradeOptions(
    mode: t.EsmPolicyMode,
    exclude: readonly string[],
    prerelease: boolean,
    progress?: t.WorkspaceUpgrade.ProgressHandler,
  ): t.WorkspaceUpgrade.Options {
    return {
      policy: {
        mode,
        exclude: exclude.length > 0 ? exclude : undefined,
      },
      prerelease,
      progress,
    };
  },

  progressText(progress: t.WorkspaceUpgrade.Progress): string {
    if (progress.kind === 'registry:jsr') return `checking ${c.white('jsr')} registry...`;
    if (progress.kind === 'registry:npm') return `checking ${c.white('npm')} registry...`;
    if (progress.kind === 'plan') return 'composing upgrade plan...';
    return 'applying workspace upgrades...';
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
        message: `Dependencies to upgrade (${promptOptions.length.toLocaleString()})`,
        options: [...promptOptions],
        maxRows: 20,
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
