import { c, Cli, Str, type t } from '../common.ts';
import { FmtBase } from './u.fmt.base.ts';
import { FmtDiagnostics } from './u.fmt.diagnostics.ts';
import { FmtSelection } from './u.fmt.selection.ts';
import { FmtStanddown } from './u.fmt.standdown.ts';

export const FmtPlan = {
  plan(upgrade: t.WorkspaceUpgrade.Result): string {
    const str = Str.builder();
    str.line(FmtPlan.summary(upgrade));

    const standdown = FmtDiagnostics.standdown(upgrade);
    if (standdown) str.blank().line(standdown);

    const registryBehindCurrent = FmtDiagnostics.registryBehindCurrent(upgrade);
    if (registryBehindCurrent) str.blank().line(registryBehindCurrent);

    const topology = FmtPlan.topologyNote(upgrade);
    if (topology) str.blank().line(topology);

    const uncollected = FmtDiagnostics.uncollected(upgrade);
    if (uncollected) str.blank().line(uncollected);

    const unresolved = FmtDiagnostics.unresolved(upgrade);
    if (unresolved) str.blank().line(unresolved);

    return Str.trimEdgeNewlines(String(str));
  },

  summary(upgrade: t.WorkspaceUpgrade.Result): string {
    const table = Cli.table([]);
    const counts = FmtSelection.summaryCounts(upgrade);

    table.push([c.gray('Release policy'), c.white(upgrade.options.policy.mode)]);
    if (upgrade.options.minimumDependencyAge > 0) {
      table.push([
        c.gray('Minimum dependency age'),
        c.white(FmtStanddown.duration(upgrade.options.minimumDependencyAge)),
      ]);
    }
    table.push([c.gray('Dependencies'), String(counts.dependencies)]);
    table.push([
      c.gray('Already latest'),
      counts.current > 0 ? c.gray(String(counts.current)) : '0',
    ]);
    if (counts.registryBehindCurrent > 0) {
      table.push([
        c.gray('Registry behind current'),
        c.yellow(String(counts.registryBehindCurrent)),
      ]);
    }
    if (counts.standdown > 0) {
      table.push([c.gray('Standdown'), c.yellow(String(counts.standdown))]);
    }
    table.push([
      c.gray('Blocked'),
      counts.blocked > 0 ? c.yellow(String(counts.blocked)) : '0',
    ]);
    const overrides = FmtSelection.overrideCount(upgrade);
    if (overrides > 0) table.push([c.gray('Overrides'), c.magenta(String(overrides))]);
    table.push([c.gray('Planned'), c.cyan(String(upgrade.totals.planned))]);

    return FmtBase.indentTable(String(table));
  },

  topologyNote(upgrade: t.WorkspaceUpgrade.Result): string {
    if (upgrade.topological.ok) return '';
    const options = FmtSelection.selectionOptions(
      upgrade,
      {
        include: [],
        exclude: [],
        dryRun: false,
        deps: upgrade.input.deps,
        mode: 'interactive',
        policy: upgrade.options.policy.mode,
        prerelease: upgrade.options.prerelease,
        minimumDependencyAge: upgrade.options.minimumDependencyAge,
        evaluatedAt: upgrade.options.evaluatedAt,
      },
    );
    if (options.length === 0) return '';
    return c.yellow(
      'The full upgrade set cannot be ordered together. Pick a smaller set to continue.',
    );
  },
} as const;
