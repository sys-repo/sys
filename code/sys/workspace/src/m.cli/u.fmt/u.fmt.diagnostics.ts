import { c, Cli, Semver, Str, type t } from '../common.ts';
import { FmtBase } from './u.fmt.base.ts';

export const FmtDiagnostics = {
  uncollected(upgrade: t.WorkspaceUpgrade.Result): string {
    if (upgrade.collect.uncollected.length === 0) return '';
    const table = Cli.table([]);
    table.push([c.gray('Uncollected'), c.gray('Reason')]);
    for (const item of upgrade.collect.uncollected) {
      table.push([
        FmtBase.name(item.entry),
        c.yellow(c.italic(FmtDiagnostics.collectReason(item.reason.code))),
      ]);
    }
    return Str.trimEdgeNewlines(String(table));
  },

  unresolved(upgrade: t.WorkspaceUpgrade.Result): string {
    if (upgrade.graph.unresolved.length === 0) return '';
    const table = Cli.table([]);
    table.push([c.gray('Graph unresolved'), c.gray('Reason')]);
    for (const item of upgrade.graph.unresolved) {
      table.push([
        FmtBase.name(item.entry),
        c.yellow(c.italic(FmtDiagnostics.graphReason(item.reason.code))),
      ]);
    }
    return Str.trimEdgeNewlines(String(table));
  },

  registryBehindCurrent(upgrade: t.WorkspaceUpgrade.Result): string {
    const rows = upgrade.collect.candidates.filter((candidate) => {
      return candidate.latest && Semver.Is.greaterThan(candidate.current, candidate.latest);
    });
    if (rows.length === 0) return '';

    const table = Cli.table([]);
    table.push([c.gray('Registry behind current'), c.gray('Registry latest')]);
    for (const item of rows) {
      table.push([
        FmtBase.name(item.entry),
        `${c.white(item.current)} ${c.gray('>')} ${c.yellow(item.latest ?? '')}`,
      ]);
    }
    return Str.trimEdgeNewlines(String(table));
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
} as const;
