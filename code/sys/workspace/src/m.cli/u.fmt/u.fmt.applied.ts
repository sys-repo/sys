import { c, Cli, Str, type t } from '../common.ts';
import { FmtBase } from './u.fmt.base.ts';
import { FmtDiagnostics } from './u.fmt.diagnostics.ts';
import type { UpdatedRow } from './u.fmt.t.ts';

export const FmtApplied = {
  applied(result: t.WorkspaceUpgrade.ApplyResult): string {
    const str = Str.builder();
    str.line(FmtApplied.appliedSummary(result));

    const updated = FmtApplied.updated(result);
    if (updated) str.blank().line(updated);

    const uncollected = FmtDiagnostics.uncollected(result.upgrade);
    if (uncollected) str.blank().line(uncollected);

    const unresolved = FmtDiagnostics.unresolved(result.upgrade);
    if (unresolved) str.blank().line(unresolved);

    return Str.trimEdgeNewlines(String(str));
  },

  commitSuggestion(result: t.WorkspaceUpgrade.ApplyResult): string {
    const message = FmtApplied.commitMessage(result);
    if (!message) return '';
    return Cli.Fmt.Commit.suggestion(message);
  },

  appliedSummary(result: t.WorkspaceUpgrade.ApplyResult): string {
    const table = Cli.table([]);
    const updated = FmtApplied.updatedRows(result).length;

    table.push([c.gray('Release Policy'), c.white(result.options.policy.mode)]);
    table.push([c.gray('Updated'), c.green(String(updated))]);

    return FmtBase.indentTable(String(table));
  },

  updated(result: t.WorkspaceUpgrade.ApplyResult): string {
    const rows = FmtApplied.updatedRows(result);
    if (rows.length === 0) return '';

    const table = Cli.table([]);
    table.push([c.gray('Dependency'), c.gray('From'), c.gray('To')]);
    for (const row of rows) {
      table.push([FmtBase.name(row.entry), c.white(row.from), c.green(row.to)]);
    }
    return Str.trimEdgeNewlines(String(table));
  },

  updatedRows(result: t.WorkspaceUpgrade.ApplyResult): readonly UpdatedRow[] {
    const currentByKey = new Map(
      result.upgrade.collect.candidates.map(
        (candidate) => [FmtBase.key(candidate.entry), candidate.current] as const,
      ),
    );

    return result.entries
      .flatMap((entry) => {
        const from = FmtBase.canonicalVersion(currentByKey.get(FmtBase.key(entry)));
        const to = FmtBase.canonicalVersion(entry.module.version);
        if (!from || !to || from === to) return [];
        return [{ entry, from, to }] as const;
      })
      .sort((a, b) => a.entry.module.name.localeCompare(b.entry.module.name));
  },

  commitMessage(result: t.WorkspaceUpgrade.ApplyResult): string {
    const rows = FmtApplied.updatedRows(result);
    if (rows.length === 0) return '';
    const suffix = FmtApplied.commitRegistrySuffix(rows);
    if (rows.length === 1) {
      return `chore(deps): upgraded ${rows[0]!.entry.module.name}${suffix}`;
    }
    return `chore(deps): upgraded ${rows.length} workspace dependencies${suffix}`;
  },

  commitRegistrySuffix(rows: readonly UpdatedRow[]): string {
    let jsr = 0;
    let npm = 0;
    for (const row of rows) {
      if (row.entry.module.registry === 'jsr') jsr += 1;
      if (row.entry.module.registry === 'npm') npm += 1;
    }
    const parts = [
      jsr > 0 ? `jsr:${jsr}` : undefined,
      npm > 0 ? `npm:${npm}` : undefined,
    ].filter((part): part is string => !!part);
    return parts.length > 0 ? ` - ${parts.join(', ')}` : '';
  },
} as const;
