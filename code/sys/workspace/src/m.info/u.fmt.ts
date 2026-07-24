import { c, Str, type t } from './common.ts';

/**
 * Format a workspace statistics block for console output.
 */
export function fmt(stats: t.WorkspaceInfo.StatsResult) {
  const builder = Str.builder()
    .line(`  ${c.cyan('Deno')}.version   ${c.green(stats.runtime.deno)}`)
    .line(`    typescript   ${c.green(stats.runtime.typescript)}`)
    .line(`            v8   ${c.green(stats.runtime.v8)}`)
    .line(c.bold('  ↓'))
    .line(c.cyan('  Workspace'))
    .line(`${c.dim('  pattern.code  ')} ${c.dim(stats.source.include[0] ?? '')}`)
    .line(`         files   ${c.cyan(stats.files.toLocaleString())}`)
    .line(`         lines   ${c.cyan((stats.lines ?? 0).toLocaleString())}`);

  for (const row of lineBreakdownRows(stats.lineBreakdown)) builder.line(row);
  return builder.toString();
}

function lineBreakdownRows(breakdown: t.WorkspaceInfo.LineBreakdown | undefined) {
  if (!breakdown) return [];

  const rows = [
    { label: 'source code', value: breakdown.source.toLocaleString() },
    { label: 'unit test', value: breakdown.unitTests.toLocaleString() },
    { label: 'ui harness', value: breakdown.uiSpecTests.toLocaleString() },
  ];
  const labelWidth = Math.max(...rows.map((row) => row.label.length));
  const valueWidth = Math.max(...rows.map((row) => row.value.length));

  return rows.map((row) =>
    c.dim(`${' '.repeat(17)}${row.label.padEnd(labelWidth)}   ${row.value.padStart(valueWidth)}`)
  );
}
