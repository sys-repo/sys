import { type t, Cli, Semver, Str, c } from './common.ts';

type SelectionOption = {
  readonly name: string;
  readonly value: string;
  readonly checked: boolean;
  readonly disabled?: boolean;
};

type SelectionLayoutInput = {
  readonly collect: { readonly candidates: readonly t.WorkspaceUpgrade.Candidate[] };
  readonly policy: { readonly decisions: readonly t.EsmPolicyDecision[] };
};

type SelectionLayout = {
  readonly name: number;
  readonly current: number;
  readonly latest: number;
  readonly note: number;
};

type UpdatedRow = {
  readonly entry: t.EsmDeps.Entry;
  readonly from: t.StringSemver;
  readonly to: t.StringSemver;
};

type SelectionState = 'selected' | 'blocked' | 'current';

type SummaryCounts = {
  readonly dependencies: number;
  readonly blocked: number;
  readonly current: number;
};

type BlockedCode =
  | 'policy:none'
  | 'policy:excluded'
  | 'version:none-available'
  | 'version:not-newer'
  | 'version:not-allowed';

export const Fmt = {
  spinnerText(text: string): string {
    return `${c.gray(c.italic(text))}\n`;
  },

  plan(upgrade: t.WorkspaceUpgrade.Result): string {
    const str = Str.builder();
    str.line(Fmt.summary(upgrade));

    const uncollected = Fmt.uncollected(upgrade);
    if (uncollected) str.blank().line(uncollected);

    const unresolved = Fmt.unresolved(upgrade);
    if (unresolved) str.blank().line(unresolved);

    return Str.trimEdgeNewlines(String(str));
  },

  applied(result: t.WorkspaceUpgrade.ApplyResult): string {
    const str = Str.builder();
    str.line(Fmt.appliedSummary(result));

    const updated = Fmt.updated(result);
    if (updated) str.blank().line(updated);

    const uncollected = Fmt.uncollected(result.upgrade);
    if (uncollected) str.blank().line(uncollected);

    const unresolved = Fmt.unresolved(result.upgrade);
    if (unresolved) str.blank().line(unresolved);

    return Str.trimEdgeNewlines(String(str));
  },

  summary(upgrade: t.WorkspaceUpgrade.Result): string {
    const table = Cli.table([]);
    const counts = Fmt.summaryCounts(upgrade);

    table.push([c.gray('Policy'), c.white(upgrade.options.policy.mode)]);
    table.push([c.gray('Dependencies'), String(counts.dependencies)]);
    table.push([c.gray('Already latest'), counts.current > 0 ? c.gray(String(counts.current)) : '0']);
    table.push([
      c.gray('Blocked'),
      counts.blocked > 0 ? c.yellow(String(counts.blocked)) : '0',
    ]);
    table.push([c.gray('Planned'), c.cyan(String(upgrade.totals.planned))]);
    if (!upgrade.topological.ok) {
      table.push([c.gray('Topology'), c.yellow('blocked')]);
    }

    return String(table)
      .split('\n')
      .map((line) => (line.trim() ? `  ${line}` : line))
      .join('\n');
  },

  appliedSummary(result: t.WorkspaceUpgrade.ApplyResult): string {
    const table = Cli.table([]);
    const updated = Fmt.updatedRows(result).length;

    table.push([c.gray('Policy'), c.white(result.options.policy.mode)]);
    table.push([c.gray('Updated'), c.green(String(updated))]);

    return String(table)
      .split('\n')
      .map((line) => (line.trim() ? `  ${line}` : line))
      .join('\n');
  },

  updated(result: t.WorkspaceUpgrade.ApplyResult): string {
    const rows = Fmt.updatedRows(result);
    if (rows.length === 0) return '';

    const table = Cli.table([]);
    table.push([c.gray('Dependency'), c.gray('From'), c.gray('To')]);
    for (const row of rows) {
      table.push([Fmt.name(row.entry), c.white(row.from), c.green(row.to)]);
    }
    return Str.trimEdgeNewlines(String(table));
  },

  uncollected(upgrade: t.WorkspaceUpgrade.Result): string {
    if (upgrade.collect.uncollected.length === 0) return '';
    const table = Cli.table([]);
    table.push([c.gray('Uncollected'), c.gray('Reason')]);
    for (const item of upgrade.collect.uncollected) {
      table.push([Fmt.name(item.entry), c.yellow(c.italic(Fmt.collectReason(item.reason.code)))]);
    }
    return Str.trimEdgeNewlines(String(table));
  },

  unresolved(upgrade: t.WorkspaceUpgrade.Result): string {
    if (upgrade.graph.unresolved.length === 0) return '';
    const table = Cli.table([]);
    table.push([c.gray('Graph unresolved'), c.gray('Reason')]);
    for (const item of upgrade.graph.unresolved) {
      table.push([Fmt.name(item.entry), c.yellow(c.italic(Fmt.graphReason(item.reason.code)))]);
    }
    return Str.trimEdgeNewlines(String(table));
  },

  selectionOptions(
    upgrade: t.WorkspaceUpgrade.Result,
    options: t.WorkspaceCli.ResolvedOptions,
  ): readonly SelectionOption[] {
    const includeSet = new Set(options.include);
    const decisionByKey = new Map(
      upgrade.policy.decisions.map(
        (decision) => [Fmt.key(decision.input.subject.entry), decision] as const,
      ),
    );
    const layout = Fmt.selectionLayout(upgrade, decisionByKey);

    return upgrade.collect.candidates
      .map((candidate) => {
        const decision = decisionByKey.get(Fmt.key(candidate.entry));
        const state = Fmt.selectionState(candidate, decision);
        if (state === 'current') return undefined;
        const name = candidate.entry.module.name;
        const alias = candidate.entry.module.alias;
        const label = Fmt.selectionLabel(candidate, decision, layout);
        const selectedByFlag = includeSet.has(name) || (!!alias && includeSet.has(alias));
        const checked = includeSet.size > 0 ? selectedByFlag : false;
        return {
          name: label,
          value: name,
          checked,
        };
      })
      .filter((option): option is SelectionOption => !!option);
  },

  selected(selection: t.WorkspaceCli.Selection): string {
    if (selection.include.length === 0) return c.gray('No dependencies to upgrade.');
    return `Selected ${c.green(selection.include.join(', '))}`;
  },

  overrideNotice(mode: t.EsmPolicyMode): string {
    return c.yellow(`Selection overrides ${c.white(mode)} policy for the picked dependencies.`);
  },

  key(entry: t.EsmDeps.Entry): string {
    return `${entry.module.registry}:${entry.module.name}`;
  },

  name(entry: t.EsmDeps.Entry): string {
    const alias = entry.module.alias ? c.gray(` (${entry.module.alias})`) : '';
    return `${c.white(entry.module.name)}${alias}`;
  },

  selectionLabel(
    candidate: t.WorkspaceUpgrade.Candidate,
    decision?: t.EsmPolicyDecision,
    layout?: SelectionLayout,
  ): string {
    const widths =
      layout ??
      Fmt.selectionLayout(
        { collect: { candidates: [candidate] }, policy: { decisions: decision ? [decision] : [] } },
        new Map(decision ? [[Fmt.key(candidate.entry), decision] as const] : []),
      );
    const name = Fmt.pad(Fmt.selectionName(candidate.entry, widths.name), widths.name);
    const current = Fmt.pad(c.white(candidate.current), widths.current);
    const state = Fmt.selectionState(candidate, decision);
    const nextText = Fmt.selectionVersion(candidate, decision);
    const nextColor =
      state === 'blocked' ? c.yellow(nextText) : state === 'selected' ? c.green(nextText) : c.gray(nextText);
    const latest = Fmt.pad(nextColor, widths.latest);
    const note = Fmt.selectionNote(candidate, decision, state);
    return `${name}  ${current} ${c.gray('→')} ${latest}${note}`;
  },

  selectionState(
    candidate: t.WorkspaceUpgrade.Candidate,
    decision?: t.EsmPolicyDecision,
  ): SelectionState {
    if (decision?.ok && decision.selection.selected?.version) return 'selected';
    if (candidate.latest && candidate.latest !== candidate.current) return 'blocked';
    return 'current';
  },

  selectionVersion(
    candidate: t.WorkspaceUpgrade.Candidate,
    decision?: t.EsmPolicyDecision,
  ): t.StringSemver {
    if (decision?.ok && decision.selection.selected?.version) return decision.selection.selected.version;
    return candidate.latest ?? candidate.current;
  },

  selectionNote(
    candidate: t.WorkspaceUpgrade.Candidate,
    decision: t.EsmPolicyDecision | undefined,
    state: SelectionState,
  ): string {
    if (state === 'blocked' && decision && !decision.ok) {
      return c.gray(c.italic(`  ${Fmt.blockedReason(decision.reason.code)}`));
    }
    const selected = decision?.ok ? decision.selection.selected?.version : undefined;
    if (state === 'selected' && selected && candidate.latest && candidate.latest !== selected) {
      return `${c.gray(c.italic('  newer blocked by policy - '))}${c.yellow(candidate.latest)}`;
    }
    return '';
  },

  summaryCounts(upgrade: t.WorkspaceUpgrade.Result): SummaryCounts {
    const decisionByKey = new Map(
      upgrade.policy.decisions.map(
        (decision) => [Fmt.key(decision.input.subject.entry), decision] as const,
      ),
    );

    return upgrade.collect.candidates.reduce<SummaryCounts>(
      (acc, candidate) => {
        const state = Fmt.selectionState(candidate, decisionByKey.get(Fmt.key(candidate.entry)));
        return {
          dependencies: acc.dependencies + 1,
          blocked: acc.blocked + (state === 'blocked' ? 1 : 0),
          current: acc.current + (state === 'current' ? 1 : 0),
        };
      },
      { dependencies: 0, blocked: 0, current: 0 },
    );
  },

  blockedReason(code: BlockedCode): string {
    if (code === 'policy:excluded') return 'excluded';
    if (code === 'policy:none') return 'blocked by policy';
    if (code === 'version:none-available') return 'no upgrade available';
    if (code === 'version:not-newer') return 'already current';
    if (code === 'version:not-allowed') return 'blocked by policy';
    return code;
  },

  collectReason(code: t.WorkspaceUpgrade.CollectCode): string {
    if (code === 'deps:load') return 'manifest load failed';
    if (code === 'registry:unsupported') return 'unsupported registry';
    if (code === 'version:missing-current') return 'version missing';
    if (code === 'registry:fetch') return 'registry fetch failed';
    return code;
  },

  graphReason(code: t.WorkspaceUpgrade.GraphCode): string {
    if (code === 'registry:info') return 'registry info unavailable';
    if (code === 'registry:graph') return 'graph unavailable';
    return code;
  },

  selectionLayout(
    upgrade: SelectionLayoutInput,
    decisionByKey = new Map(
      upgrade.policy.decisions.map((decision) => [Fmt.key(decision.input.subject.entry), decision]),
    ),
  ): SelectionLayout {
    const widths = { name: 0, current: 0, latest: 0, note: 0 };

    for (const candidate of upgrade.collect.candidates) {
      const decision = decisionByKey.get(Fmt.key(candidate.entry));
      const state = Fmt.selectionState(candidate, decision);
      if (state === 'current') continue;

      widths.name = Math.max(widths.name, Fmt.width(Fmt.name(candidate.entry)));
      widths.current = Math.max(widths.current, candidate.current.length);
      widths.latest = Math.max(widths.latest, Fmt.selectionVersion(candidate, decision).length);
      widths.note = Math.max(widths.note, Fmt.selectionNote(candidate, decision, state).length);
    }

    const screen = Cli.Screen.size();
    const budget = Math.max(24, screen.width - 8);
    const reserved = widths.current + widths.latest + widths.note + 9;

    return {
      ...widths,
      name: Math.max(16, Math.min(widths.name, budget - reserved)),
    };
  },

  selectionName(entry: t.EsmDeps.Entry, width: number): string {
    const alias = entry.module.alias ? ` (${entry.module.alias})` : '';
    const text = `${entry.module.name}${alias}`;
    return c.white(Fmt.truncate(text, width));
  },

  pad(value: string, width: number): string {
    const len = Fmt.width(value);
    return len >= width ? value : `${value}${' '.repeat(width - len)}`;
  },

  width(value: string): number {
    return Cli.stripAnsi(value).length;
  },

  truncate(value: string, width: number): string {
    if (value.length <= width) return value;
    if (width <= 1) return value.slice(0, width);
    return `${value.slice(0, Math.max(0, width - 1))}…`;
  },

  updatedRows(result: t.WorkspaceUpgrade.ApplyResult): readonly UpdatedRow[] {
    const currentByKey = new Map(
      result.upgrade.collect.candidates.map(
        (candidate) => [Fmt.key(candidate.entry), candidate.current] as const,
      ),
    );

    return result.entries
      .flatMap((entry) => {
        const from = Fmt.canonicalVersion(currentByKey.get(Fmt.key(entry)));
        const to = Fmt.canonicalVersion(entry.module.version);
        if (!from || !to || from === to) return [];
        return [{ entry, from, to }] as const;
      })
      .sort((a, b) => a.entry.module.name.localeCompare(b.entry.module.name));
  },

  canonicalVersion(version?: string): t.StringSemver | undefined {
    if (!version) return;
    const coerced = Semver.coerce(version).version;
    const clean = Semver.Prefix.strip(coerced);
    return clean ? (clean as t.StringSemver) : undefined;
  },
} as const;
