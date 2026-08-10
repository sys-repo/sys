import { c, Cli, Hash, Path, Str, type t, Time } from './common.ts';

const CELL = {
  gap: Cli.Table.cellGap,
} as const;

const GRAPH = {
  hashLength: 5,
  label: 'graph',
} as const;

const WORKSPACE = {
  label: '  Workspace',
} as const;

/** Zero-based start column for trailing ownership detail. */
const DETAIL_COLUMN = 32;
const RUNTIME_VALUE_COLUMN = Cli.Fmt.Text.Width.measure('  Deno.version   ');

type Labels = {
  readonly primary: string;
  readonly include: string;
  readonly files: string;
  readonly lines: string;
};

type Layout = {
  readonly labels: Labels;
  readonly labelWidth: number;
  readonly valueColumn: number;
  readonly detailColumn: number;
};

type GraphRef = {
  readonly plain: string;
  readonly shortHash?: string;
};

/** Format source statistics for console output. */
export function fmt(
  stats: t.WorkspaceInfo.StatsResult,
  options: t.WorkspaceInfo.FormatOptions = {},
) {
  const layout = createLayout(stats);
  const builder = Str.builder()
    .line(`  ${c.cyan('Deno')}.version   ${c.green(stats.runtime.deno)}`)
    .line(`    typescript   ${c.green(stats.runtime.typescript)}`)
    .line(`            v8   ${c.green(stats.runtime.v8)}`)
    .line(c.bold('  ↓'))
    .line(workspaceRow(layout, options));

  if (stats.kind === 'glob') {
    for (const row of includeRows(stats.source.include, layout.labels.primary, layout, options)) {
      builder.line(row);
    }
  } else {
    builder.line(ownershipRow(stats, layout, options));
    for (const row of includeRows(stats.source.include, layout.labels.include, layout, options)) {
      builder.line(row);
    }
  }

  builder
    .line(metricRow(layout.labels.files, stats.files, layout))
    .line(metricRow(layout.labels.lines, stats.lines ?? 0, layout));

  for (const row of lineBreakdownRows(stats.lineBreakdown, layout.valueColumn)) builder.line(row);
  return builder.toString();
}

function createLayout(stats: t.WorkspaceInfo.StatsResult): Layout {
  const labels: Labels = stats.kind === 'package'
    ? {
      primary: '      packages',
      include: '       include',
      files: '         files',
      lines: '         lines',
    }
    : {
      primary: '  pattern.code',
      include: '',
      files: '         files',
      lines: '         lines',
    };
  const values = [
    stats.files.toLocaleString(),
    (stats.lines ?? 0).toLocaleString(),
    ...(stats.kind === 'package' ? [stats.packages.length.toLocaleString()] : []),
  ];
  const labelWidth = Cli.Fmt.Text.Width.max([
    labels.primary,
    labels.include,
    labels.files,
    labels.lines,
  ]);
  const valueColumn = Math.max(labelWidth + CELL.gap, RUNTIME_VALUE_COLUMN);
  const detailColumn = Math.max(
    DETAIL_COLUMN,
    valueColumn + Cli.Fmt.Text.Width.max(values) + CELL.gap,
  );
  return { labels, labelWidth, valueColumn, detailColumn };
}

function workspaceRow(
  layout: Layout,
  options: t.WorkspaceInfo.FormatOptions,
): string {
  const artifact = options.graph;
  if (!artifact) return c.cyan(WORKSPACE.label);

  const snapshot = artifact.snapshot;
  const graph = snapshot.graph;
  const meta = snapshot['.meta'];
  const outputWidth = Cli.Fmt.Text.Width.fit({
    width: options.width,
    terminal: options.terminal,
  });
  const graphColumnWidth = Math.max(0, layout.detailColumn - layout.valueColumn - 1);
  const refs = graphRefs(meta.hash['/graph']);
  const ref = refs.find((candidate) => {
    const width = Cli.Fmt.Text.Width.measure(candidate.plain);
    return width <= graphColumnWidth && layout.valueColumn + width <= outputWidth;
  });
  if (!ref) return c.cyan(WORKSPACE.label);

  const title = Cli.Fmt.Text.Width.padEnd(WORKSPACE.label, layout.labelWidth);
  const prefix = `${c.cyan(title)}${' '.repeat(layout.valueColumn - layout.labelWidth)}`;
  const graphRef = renderGraphRef(ref, artifact.path, options);
  const edgeCount = graph.edges.length;
  const edgeText = `${edgeCount.toLocaleString()} ${edgeCount === 1 ? 'edge' : 'edges'}`;
  const edgeFits = layout.detailColumn + Cli.Fmt.Text.Width.measure(edgeText) <= outputWidth;
  if (!edgeFits) return `${prefix}${graphRef}`;

  const generatedAt = meta.modifiedAt ?? meta.createdAt;
  const elapsed = Time.elapsed(generatedAt);
  const ageText = elapsed.ok ? ` • ${elapsed}` : '';
  const ageFits = ageText.length > 0 &&
    layout.detailColumn + Cli.Fmt.Text.Width.measure(`${edgeText}${ageText}`) <= outputWidth;
  const padding = Math.max(
    0,
    layout.detailColumn - layout.valueColumn - Cli.Fmt.Text.Width.measure(ref.plain),
  );
  const summary = `${c.dim(edgeText)}${ageFits ? c.dim(ageText) : ''}`;
  return `${prefix}${graphRef}${' '.repeat(padding)}${summary}`;
}

function graphRefs(hash: t.StringHash): readonly GraphRef[] {
  const shortHash = Hash.shorten(hash, [0, GRAPH.hashLength], { trimPrefix: true });
  if (!shortHash) return [{ plain: GRAPH.label }];
  return [
    { plain: `${GRAPH.label}:#${shortHash}`, shortHash },
    { plain: GRAPH.label },
  ];
}

function renderGraphRef(
  ref: GraphRef,
  path: t.StringPath,
  options: t.WorkspaceInfo.FormatOptions,
): string {
  const terminal = options.terminal ?? Cli.Is.terminal('stdout');
  const display = c.dim(ref.plain);
  const linkedDisplay = terminal ? c.underline(display) : display;
  return terminal ? Cli.Fmt.hyperlink(linkedDisplay, Path.toFileUrl(path)) : display;
}

function includeRows(
  include: readonly t.StringPath[],
  firstLabel: string,
  layout: Layout,
  options: t.WorkspaceInfo.FormatOptions,
): readonly string[] {
  const rows: string[] = [];
  const patterns = include.length === 0 ? ['[]'] : include;
  for (const [index, pattern] of patterns.entries()) {
    const text = fitDetail(pattern, layout.valueColumn, options);
    const label = Cli.Fmt.Text.Width.padEnd(index === 0 ? firstLabel : '', layout.labelWidth);
    if (!text) {
      if (index === 0) rows.push(c.dim(label));
      break;
    }
    rows.push(
      `${c.dim(label)}${' '.repeat(layout.valueColumn - layout.labelWidth)}${c.dim(text)}`,
    );
  }
  return rows;
}

function ownershipRow(
  stats: t.WorkspaceInfo.PackageResult,
  layout: Layout,
  options: t.WorkspaceInfo.FormatOptions,
): string {
  const label = Cli.Fmt.Text.Width.padEnd(layout.labels.primary, layout.labelWidth);
  const value = stats.packages.length.toLocaleString();
  const detail = fitDetail(`${stats.selection.scope}/*`, layout.detailColumn, options);
  const prefix = `${c.dim(label)}${' '.repeat(layout.valueColumn - layout.labelWidth)}${
    c.cyan(value)
  }`;
  if (!detail) return prefix;

  const padding = Math.max(
    0,
    layout.detailColumn - layout.valueColumn - Cli.Fmt.Text.Width.measure(value),
  );
  return `${prefix}${' '.repeat(padding)}${c.dim(detail)}`;
}

function metricRow(label: string, value: number, layout: Layout): string {
  const paddedLabel = Cli.Fmt.Text.Width.padEnd(label, layout.labelWidth);
  return `${c.dim(paddedLabel)}${' '.repeat(layout.valueColumn - layout.labelWidth)}${
    c.cyan(value.toLocaleString())
  }`;
}

function fitDetail(
  detail: string,
  column: number,
  options: t.WorkspaceInfo.FormatOptions,
): string {
  const width = Cli.Fmt.Text.Width.fit({
    width: options.width,
    reserve: column,
    terminal: options.terminal,
  });
  return width === 0 ? '' : Cli.Fmt.Text.ellipsize(detail, width);
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
