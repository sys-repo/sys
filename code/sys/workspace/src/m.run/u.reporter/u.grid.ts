import { c, Cli, Num, Str, type t, Time } from '../common.ts';
import { formatContinuationSummary } from '../u.fmt/u.continuation.ts';
import { packageLabel } from '../u/u.identity.ts';
import type { ParallelProgressCompleted, ParallelProgressRunning } from '../u/u.progress.ts';

export type ReporterGridLayout = {
  readonly columns: number;
  readonly cellWidth: number;
};

const GRID_GUTTER = '      ';
const GRID_GUTTER_WIDTH = Cli.Fmt.Text.Width.measure(GRID_GUTTER);
const GRID_INDENT = '  ';
const GRID_INDENT_WIDTH = Cli.Fmt.Text.Width.measure(GRID_INDENT);
const CELL_CHROME_WIDTH = 4;
const MIN_CELL_WIDTH = 24;
const MIN_LABEL_WIDTH = 8;

/** Resolve the adaptive grid shared by active and final package projections. */
export function reporterGridLayout(width: number): ReporterGridLayout | undefined {
  const maxColumns = width >= 120 ? 3 : width >= 80 ? 2 : 1;
  const usable = width - GRID_INDENT_WIDTH;
  const columns = columnCount(maxColumns, usable);
  if (columns < 1) return undefined;
  return { columns, cellWidth: cellWidth(usable, columns) };
}

/** Use the greatest bounded running-job column count whose complete cells fit. */
export function runningReporterGridLayout(
  running: readonly ParallelProgressRunning[],
  width: number,
): ReporterGridLayout | undefined {
  if (running.length === 0) return undefined;
  const usable = width - GRID_INDENT_WIDTH;
  const maximum = Math.min(
    running.length,
    Math.max(0, Math.floor(usable / GRID_GUTTER_WIDTH) + 1),
  );

  for (let columns = maximum; columns >= 1; columns -= 1) {
    const widths = runningColumnWidths(running, columns);
    const gutters = GRID_GUTTER_WIDTH * (columns - 1);
    if (Num.sum(widths) + gutters <= usable) {
      return { columns, cellWidth: Math.max(...widths) };
    }
  }

  if (usable <= 0 || running.some((item) => runningCellMinimumWidth(item) > usable)) {
    return undefined;
  }
  return { columns: 1, cellWidth: usable };
}

/** Prefer fewer final columns when doing so preserves complete package labels. */
export function finalReporterGridLayout(
  completed: readonly ParallelProgressCompleted[],
  width: number,
): ReporterGridLayout {
  const maximum = reporterGridLayout(width);
  if (!maximum) {
    return {
      columns: 1,
      cellWidth: Math.max(MIN_CELL_WIDTH, width - GRID_INDENT_WIDTH),
    };
  }

  const usable = width - GRID_INDENT_WIDTH;
  for (let columns = maximum.columns; columns > 1; columns -= 1) {
    const candidateWidth = cellWidth(usable, columns);
    if (completed.every((item) => completedCellFits(item, candidateWidth))) {
      return { columns, cellWidth: candidateWidth };
    }
  }
  return { columns: 1, cellWidth: cellWidth(usable, 1) };
}

/** Render row-major cells into a width-aware terminal grid. */
export function formatReporterGrid(cells: readonly string[], columns: number) {
  const widths = columnWidths(cells, columns);
  const lines: string[] = [];
  for (let index = 0; index < cells.length; index += columns) {
    const row: string[] = [];
    let lastOffset = -1;
    for (let offset = 0; offset < columns; offset += 1) {
      if (cells[index + offset]) lastOffset = offset;
    }
    for (let offset = 0; offset <= lastOffset; offset += 1) {
      const cell = cells[index + offset];
      if (!cell) continue;
      row.push(
        offset === lastOffset ? cell : Cli.Fmt.Text.Width.padEnd(cell, widths[offset] ?? 0),
      );
    }
    if (row.length > 0) lines.push(`${GRID_INDENT}${row.join(GRID_GUTTER)}`);
  }
  return lines.join('\n');
}

/** Render recency-ordered completions down columns before flowing right. */
export function formatCompletedReporterGrid(
  cells: readonly string[],
  columns: number,
  rows: number,
) {
  const ordered: string[] = [];
  for (let index = 0; index < cells.length; index += 1) {
    const column = Math.floor(index / rows);
    const row = index % rows;
    ordered[row * columns + column] = cells[index] ?? '';
  }
  return formatReporterGrid(ordered, columns);
}

export function formatRunningCell(item: ParallelProgressRunning, width: number) {
  const elapsed = formatRunningElapsed(item.elapsed);
  const elapsedWidth = Cli.Fmt.Text.Width.measure(elapsed);
  const labelWidth = Num.clamp(
    MIN_LABEL_WIDTH,
    width - CELL_CHROME_WIDTH,
    width - elapsedWidth - CELL_CHROME_WIDTH,
  );
  const label = formatLabel(packageLabel(item), labelWidth);
  return `${c.cyan('⦿')}  ${label} ${c.gray(elapsed)}`;
}

export function formatCompletedCell(item: ParallelProgressCompleted, width: number) {
  const mark = completedMark(item.kind);
  const suffix = completedSuffix(item);
  const suffixWidth = Cli.Fmt.Text.Width.measure(suffix);
  const labelWidth = Num.clamp(
    MIN_LABEL_WIDTH,
    width - CELL_CHROME_WIDTH,
    width - suffixWidth - CELL_CHROME_WIDTH,
  );
  const label = formatLabel(packageLabel(item), labelWidth);
  return `${mark}  ${label}${suffix}`;
}

function formatLabel(label: string, width: number): string {
  if (Cli.Fmt.Text.Width.measure(label) <= width) return c.white(label);
  return Cli.Fmt.Text.ellipsize(label, width, {
    render: ({ head, ellipsis, tail }) => {
      return `${c.white(head)}${Cli.Fmt.omission(ellipsis)}${c.white(tail)}`;
    },
  });
}

export function completedOverflowSummary(hidden: readonly ParallelProgressCompleted[]) {
  return formatContinuationSummary(String(hidden.length), completedSeverityColor(hidden));
}

export function completedSeverityColor(items: readonly ParallelProgressCompleted[]) {
  let hasWarning = false;
  for (const item of items) {
    if (item.kind === 'failed') return 'red';
    if (item.kind === 'blocked' || item.kind === 'skipped') hasWarning = true;
  }
  return hasWarning ? 'yellow' : 'green';
}

function runningColumnWidths(
  running: readonly ParallelProgressRunning[],
  columns: number,
) {
  const widths: number[] = [];
  for (const [index, item] of running.entries()) {
    const column = index % columns;
    widths[column] = Math.max(widths[column] ?? 0, runningCellWidth(item));
  }
  return widths;
}

function runningCellWidth(item: ParallelProgressRunning) {
  const labelWidth = Cli.Fmt.Text.Width.measure(packageLabel(item));
  const elapsedWidth = Cli.Fmt.Text.Width.measure(formatRunningElapsed(item.elapsed));
  return labelWidth + elapsedWidth + CELL_CHROME_WIDTH;
}

function runningCellMinimumWidth(item: ParallelProgressRunning) {
  const labelWidth = Cli.Fmt.Text.Width.measure(packageLabel(item));
  const elapsedWidth = Cli.Fmt.Text.Width.measure(formatRunningElapsed(item.elapsed));
  return Math.min(labelWidth, MIN_LABEL_WIDTH) + elapsedWidth + CELL_CHROME_WIDTH;
}

function completedCellFits(item: ParallelProgressCompleted, width: number) {
  const labelWidth = Cli.Fmt.Text.Width.measure(packageLabel(item));
  const suffixWidth = Cli.Fmt.Text.Width.measure(completedSuffix(item));
  return labelWidth + suffixWidth + CELL_CHROME_WIDTH <= width;
}

function columnCount(maxColumns: number, usable: number) {
  for (let columns = maxColumns; columns > 0; columns -= 1) {
    if (cellWidth(usable, columns) >= MIN_CELL_WIDTH) return columns;
  }
  return 0;
}

function cellWidth(usable: number, columns: number) {
  const gutterWidth = GRID_GUTTER_WIDTH * (columns - 1);
  const raw = (usable - gutterWidth) / columns;
  return raw - (raw % 1);
}

function columnWidths(cells: readonly string[], columns: number) {
  const widths: number[] = [];
  for (let index = 0; index < cells.length; index += 1) {
    const column = index % columns;
    const width = Cli.Fmt.Text.Width.measure(cells[index] ?? '');
    widths[column] = Math.max(widths[column] ?? 0, width);
  }
  return widths;
}

function formatRunningElapsed(elapsed: t.Msecs) {
  if (elapsed < Time.Date.MINUTE) return Time.duration(elapsed).toString();
  const minutes = Num.round(elapsed / Time.Date.MINUTE, 1);
  return `${minutes.toFixed(1)}m`;
}

function completedSuffix(item: ParallelProgressCompleted) {
  const parts: string[] = [];
  const stats = completedStats(item.testStats);
  if (stats) parts.push(stats);
  if (item.elapsed !== undefined) parts.push(c.gray(Time.duration(item.elapsed).toString()));
  return parts.length > 0 ? ` ${parts.join(c.gray(', '))}` : '';
}

function completedStats(stats?: t.WorkspaceRun.Test.Stats.Result) {
  if (!stats) return '';
  if (stats.kind !== 'observed') return c.gray('—');
  const tests = c.gray(`${stats.tests} ${Str.plural(stats.tests, 'test')}`);
  const failed = stats.failed > 0 ? `${c.gray(', ')}${c.red(`${stats.failed} failed`)}` : '';
  return `${tests}${failed}`;
}

function completedMark(kind: ParallelProgressCompleted['kind']) {
  if (kind === 'passed') return c.green('✓');
  if (kind === 'failed') return c.red('✕');
  if (kind === 'blocked') return c.yellow('⊘');
  return c.gray('↷');
}
