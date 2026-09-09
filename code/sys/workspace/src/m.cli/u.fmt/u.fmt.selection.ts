import { c, Cli, Obj, Semver, type t } from '../common.ts';
import { FmtBase } from './u.fmt.base.ts';
import { FmtStanddown } from './u.fmt.standdown.ts';
import type {
  BlockedCode,
  PackagePolicyCarrier,
  SelectionLayout,
  SelectionLayoutInput,
  SelectionOption,
  SelectionState,
  SummaryCounts,
} from './u.fmt.t.ts';

const NAME_MIN_WIDTH = 25;
const EMPTY_OVERRIDE_PARENTS: ReadonlySet<string> = new Set();

export type SelectionDependencies = {
  readonly size: typeof Cli.Screen.size;
};

const DEFAULT_DEPS: SelectionDependencies = {
  size: Cli.Screen.size,
};

export function selectionOptionsWith(
  deps: SelectionDependencies,
  upgrade: t.WorkspaceUpgrade.Result,
  options: t.WorkspaceCli.ResolvedOptions,
): readonly SelectionOption[] {
  const includeSet = new Set(options.include);
  const decisionByKey = new Map(
    upgrade.policy.decisions.map(
      (decision) => [FmtBase.key(decision.input.subject.entry), decision] as const,
    ),
  );
  const layout = selectionLayoutWith(deps, upgrade, decisionByKey);

  return upgrade.collect.candidates.flatMap((candidate): readonly SelectionOption[] => {
    const decision = decisionByKey.get(FmtBase.key(candidate.entry));
    const state = FmtSelection.selectionState(candidate, decision);
    if (state === 'current' || state === 'registry-behind-current') return [];
    const name = candidate.entry.module.name;
    const alias = candidate.entry.module.alias;
    const label = FmtSelection.selectionLabel(
      candidate,
      decision,
      layout,
      upgrade.options.evaluatedAt,
    );
    const selectedByFlag = includeSet.has(name) || (!!alias && includeSet.has(alias));
    const checked = includeSet.size > 0 ? selectedByFlag : state === 'selected';
    const disabled = FmtStanddown.disabled(candidate, decision);
    return [{ name: label, value: name, checked: disabled ? false : checked, disabled }];
  });
}

export function selectionLayoutWith(
  deps: SelectionDependencies,
  upgrade: SelectionLayoutInput,
  decisionByKey = new Map(
    upgrade.policy.decisions.map((
      decision,
    ) => [FmtBase.key(decision.input.subject.entry), decision]),
  ),
): SelectionLayout {
  const overrideParents = FmtSelection.overrideParentSet(upgrade);
  const evaluatedAt = upgrade.options?.evaluatedAt;
  const widths = { name: 0, current: 0, latest: 0, note: 0 };

  for (const candidate of upgrade.collect.candidates) {
    const decision = decisionByKey.get(FmtBase.key(candidate.entry));
    const state = FmtSelection.selectionState(candidate, decision);
    if (state === 'current' || state === 'registry-behind-current') continue;

    widths.name = Math.max(widths.name, FmtBase.width(FmtBase.name(candidate.entry)));
    widths.current = Math.max(widths.current, candidate.current.length);
    widths.latest = Math.max(
      widths.latest,
      FmtSelection.selectionVersion(candidate, decision).length,
    );
    widths.note = Math.max(
      widths.note,
      FmtBase.width(
        FmtSelection.selectionNote(candidate, decision, state, overrideParents, evaluatedAt),
      ),
    );
  }

  const screen = deps.size();
  const budget = Math.max(24, screen.width - 8);
  const reserved = widths.current + widths.latest + widths.note + 9;

  return {
    ...widths,
    name: Math.max(NAME_MIN_WIDTH, Math.min(widths.name, budget - reserved)),
    overrideParents,
  };
}

export const FmtSelection = Object.freeze(
  {
    selectionOptions(
      upgrade: t.WorkspaceUpgrade.Result,
      options: t.WorkspaceCli.ResolvedOptions,
    ): readonly SelectionOption[] {
      return selectionOptionsWith(DEFAULT_DEPS, upgrade, options);
    },

    selected(selection: t.WorkspaceCli.Selection): string {
      if (selection.include.length === 0) return c.gray('No dependencies to upgrade.');
      return `Selected ${c.green(selection.include.join(', '))}`;
    },

    overrideNotice(mode: t.EsmPolicy.Mode): string {
      return c.yellow(`Selection overrides ${c.white(mode)} policy for the picked dependencies.`);
    },

    selectionLabel(
      candidate: t.WorkspaceUpgrade.Candidate,
      decision?: t.EsmPolicy.Decision,
      layout?: SelectionLayout,
      evaluatedAt?: t.UnixTimestamp,
    ): string {
      const widths = layout ??
        FmtSelection.selectionLayout(
          {
            collect: { candidates: [candidate] },
            policy: { decisions: decision ? [decision] : [] },
          },
          new Map(decision ? [[FmtBase.key(candidate.entry), decision] as const] : []),
        );
      const name = FmtBase.pad(
        FmtSelection.selectionName(candidate.entry, widths.name),
        widths.name,
      );
      const current = FmtBase.pad(c.white(candidate.current), widths.current);
      const state = FmtSelection.selectionState(candidate, decision);
      const nextText = FmtSelection.selectionVersion(candidate, decision);
      const nextColor = state === 'blocked'
        ? c.yellow(nextText)
        : state === 'selected'
        ? c.green(nextText)
        : c.gray(nextText);
      const latest = FmtBase.pad(nextColor, widths.latest);
      const note = FmtSelection.selectionNote(
        candidate,
        decision,
        state,
        widths.overrideParents,
        evaluatedAt,
      );
      return `${name}  ${current} ${c.gray('→')} ${latest}${note}`;
    },

    selectionState(
      candidate: t.WorkspaceUpgrade.Candidate,
      decision?: t.EsmPolicy.Decision,
    ): SelectionState {
      if (decision?.ok && decision.selection.selected?.version) return 'selected';
      if (candidate.latest && Semver.Is.greaterThan(candidate.latest, candidate.current)) {
        return 'blocked';
      }
      if (candidate.latest && Semver.Is.greaterThan(candidate.current, candidate.latest)) {
        return 'registry-behind-current';
      }
      return 'current';
    },

    selectionVersion(
      candidate: t.WorkspaceUpgrade.Candidate,
      decision?: t.EsmPolicy.Decision,
    ): t.StringSemver {
      if (decision?.ok && decision.selection.selected?.version) {
        return decision.selection.selected.version;
      }
      return candidate.latest ?? candidate.current;
    },

    selectionNote(
      candidate: t.WorkspaceUpgrade.Candidate,
      decision: t.EsmPolicy.Decision | undefined,
      state: SelectionState,
      overrideParents: ReadonlySet<string> = EMPTY_OVERRIDE_PARENTS,
      evaluatedAt?: t.UnixTimestamp,
    ): string {
      const override = FmtSelection.selectionOverrideHint(candidate, overrideParents);
      const standdown = FmtStanddown.selectionNote(candidate, evaluatedAt);
      if (
        standdown && state === 'blocked' && decision && !decision.ok &&
        FmtSelection.countsAsBlocked(decision)
      ) {
        return `${
          FmtStanddown.note(`${FmtSelection.blockedReason(decision.reason.code)}; ${standdown}`)
        }${override}`;
      }
      if (standdown && (state === 'blocked' || state === 'selected')) {
        return `${FmtStanddown.note(standdown)}${override}`;
      }
      if (state === 'blocked' && decision && !decision.ok) {
        return `${
          c.gray(c.italic(`  ${FmtSelection.blockedReason(decision.reason.code)}`))
        }${override}`;
      }
      const selected = decision?.ok ? decision.selection.selected?.version : undefined;
      if (
        state === 'selected' &&
        selected &&
        candidate.latest &&
        Semver.Is.greaterThan(candidate.latest, selected)
      ) {
        return `${c.gray(c.italic('  newer blocked by policy - '))}${
          c.yellow(candidate.latest)
        }${override}`;
      }
      return override;
    },

    overrideParents(upgrade: PackagePolicyCarrier): readonly string[] {
      const overrides = upgrade.collect.packageJson?.overrides;
      if (!overrides) return [];
      return Obj.keys(overrides).map(String).toSorted((a, b) => a.localeCompare(b));
    },

    overrideParentSet(upgrade: PackagePolicyCarrier): ReadonlySet<string> {
      return new Set(FmtSelection.overrideParents(upgrade));
    },

    overrideCount(upgrade: PackagePolicyCarrier): number {
      return FmtSelection.overrideParents(upgrade).length;
    },

    selectionOverrideHint(
      candidate: t.WorkspaceUpgrade.Candidate,
      overrideParents: ReadonlySet<string>,
    ): string {
      return overrideParents.has(candidate.entry.module.name)
        ? c.magenta(c.italic('  override parent'))
        : '';
    },

    summaryCounts(upgrade: t.WorkspaceUpgrade.Result): SummaryCounts {
      const decisionByKey = new Map(
        upgrade.policy.decisions.map(
          (decision) => [FmtBase.key(decision.input.subject.entry), decision] as const,
        ),
      );

      return upgrade.collect.candidates.reduce<SummaryCounts>(
        (acc, candidate) => {
          const state = FmtSelection.selectionState(
            candidate,
            decisionByKey.get(FmtBase.key(candidate.entry)),
          );
          return {
            dependencies: acc.dependencies + 1,
            blocked: acc.blocked +
              (state === 'blocked' && FmtSelection.countsAsBlocked(
                  decisionByKey.get(FmtBase.key(candidate.entry)),
                )
                ? 1
                : 0),
            standdown: acc.standdown + (FmtStanddown.latestFact(candidate) ? 1 : 0),
            current: acc.current + (state === 'current' ? 1 : 0),
            registryBehindCurrent: acc.registryBehindCurrent +
              (state === 'registry-behind-current' ? 1 : 0),
          };
        },
        { dependencies: 0, blocked: 0, standdown: 0, current: 0, registryBehindCurrent: 0 },
      );
    },

    countsAsBlocked(decision?: t.EsmPolicy.Decision): boolean {
      if (!decision || decision.ok) return false;
      const code = decision.reason.code;
      return code === 'policy:excluded' || code === 'policy:none' || code === 'version:not-allowed';
    },

    blockedReason(code: BlockedCode): string {
      if (code === 'policy:excluded') return 'excluded';
      if (code === 'policy:none') return 'blocked by policy';
      if (code === 'version:none-available') return 'no upgrade available';
      if (code === 'version:not-newer') return 'already current';
      if (code === 'version:not-allowed') return 'blocked by policy';
      return code;
    },

    selectionLayout(
      upgrade: SelectionLayoutInput,
      decisionByKey = new Map(
        upgrade.policy.decisions.map((
          decision,
        ) => [FmtBase.key(decision.input.subject.entry), decision]),
      ),
    ): SelectionLayout {
      return selectionLayoutWith(DEFAULT_DEPS, upgrade, decisionByKey);
    },

    selectionName(entry: t.EsmDeps.Entry, width: number): string {
      const alias = entry.module.alias ? ` (${entry.module.alias})` : '';
      const text = `${entry.module.name}${alias}`;
      return c.white(FmtBase.truncate(text, width));
    },
  } as const,
);
