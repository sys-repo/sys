import { c, Str, type t } from './common.ts';

/**
 * Format a workspace statistics block for console output.
 */
export function fmt(stats: t.WorkspaceInfo.StatsResult) {
  const builder = Str.builder()
    .line(`  ${c.yellow('Deno')}.version   ${c.green(stats.runtime.deno)}`)
    .line(`    typescript   ${c.green(stats.runtime.typescript)}`)
    .line(`            v8   ${c.green(stats.runtime.v8)}`)
    .line(c.bold('  ↓'))
    .line(c.yellow('  Workspace'))
    .line(`${c.dim('  pattern.code  ')} ${c.dim(stats.source.include[0] ?? '')}`)
    .line(`         files   ${c.yellow(stats.files.toLocaleString())}`)
    .line(`         lines   ${c.yellow((stats.lines ?? 0).toLocaleString())}`);

  for (const row of lineBreakdownRows(stats.lineBreakdown)) builder.line(row);
  return builder.toString();
}

function lineBreakdownRows(breakdown: t.WorkspaceInfo.LineBreakdown | undefined) {
  if (!breakdown) return [];

  const rows = [
    { label: 'source', value: breakdown.source.toLocaleString() },
    { label: 'unit tests', value: breakdown.unitTests.toLocaleString() },
    { label: 'ui spec/tests', value: breakdown.uiSpecTests.toLocaleString() },
  ];
  const width = Math.max(...rows.map((row) => row.value.length));

  return rows.map((row) => c.dim(`${' '.repeat(17)}${row.value.padStart(width)} ${row.label}`));
}
