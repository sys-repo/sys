import { c, Cli, Str, type t } from './common.ts';

/** Format a workspace statistics block for console output. */
export function fmt(stats: t.WorkspaceInfo.StatsResult) {
  const builder = Str.builder()
    .line(`  ${c.cyan('Deno')}.version   ${c.green(stats.runtime.deno)}`)
    .line(`    typescript   ${c.green(stats.runtime.typescript)}`)
    .line(`            v8   ${c.green(stats.runtime.v8)}`)
    .line(c.bold('  ↓'))
    .line(c.cyan('  Workspace'));

  if (stats.kind === 'glob') {
    builder.line(`${c.dim('  pattern.code  ')} ${c.dim(stats.source.include[0] ?? '')}`);
  } else {
    const count = stats.packages.length.toLocaleString();
    const label = '    packages'.padEnd(18);
    builder.line(`${c.dim(label)}${c.cyan(count)}   ${c.dim(`${stats.selection.scope}/*`)}`);
  }

  const metricIndent = stats.kind === 'package' ? '       ' : '         ';
  const metricWidth = stats.kind === 'package' ? 18 : 17;
  builder
    .line(`${metricIndent}files`.padEnd(metricWidth) + c.cyan(stats.files.toLocaleString()))
    .line(`${metricIndent}lines`.padEnd(metricWidth) + c.cyan((stats.lines ?? 0).toLocaleString()));

  const branchIndent = stats.kind === 'package' ? 15 : 17;
  for (const row of lineBreakdownRows(stats.lineBreakdown, branchIndent)) builder.line(row);
  return builder.toString();
}

function lineBreakdownRows(
  breakdown: t.WorkspaceInfo.LineBreakdown | undefined,
  indent: number,
) {
  if (!breakdown) return [];

  const rows = [
    { label: 'source code', value: breakdown.source.toLocaleString() },
    { label: 'unit test', value: breakdown.unitTests.toLocaleString() },
    { label: 'ui harness', value: breakdown.uiSpecTests.toLocaleString() },
  ];
  const labelWidth = Math.max(...rows.map((row) => row.label.length));
  const valueWidth = Math.max(...rows.map((row) => row.value.length));

  return rows.map((row, index) => {
    const branch = Cli.Fmt.Tree.branch([index, rows]);
    return c.dim(
      `${' '.repeat(indent)}${branch} ${row.label.padEnd(labelWidth)}   ${
        row.value.padStart(valueWidth)
      }`,
    );
  });
}
