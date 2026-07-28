import { c, Cli, Num, Str, type t, Time } from '../common.ts';
import type { FailedPackage } from './u.failure.ts';
import { formatContinuationSummary } from './u.fmt.continuation.ts';
import { formatFailedPackageIndex } from './u.fmt.ts';
import type { ParallelProgressCompleted, ParallelProgressRunning } from './u.progress.ts';

export type ParallelProgressFormatArgs = {
  runnableTotal: number;
  passed: number;
  skipped: number;
  blocked: number;
  blockedRunnable: number;
  failed: number;
  pending: number;
  running: readonly ParallelProgressRunning[];
  completed?: readonly ParallelProgressCompleted[];
  failures?: readonly FailedPackage[];
  elapsed?: t.Msecs;
  terminal?: boolean;
  width?: number;
  viewport?: t.Cli.Screen.Size;
  cursorRows?: number;
};

export type ParallelProgressLayout = {
  readonly frame: string;
  readonly completion: t.WorkspaceRun.Test.Reporter.ScreenCompletion;
};

type GridLayout = {
  readonly columns: number;
  readonly cellWidth: number;
};

type FailureSection = {
  readonly text: string;
  readonly visible: number;
};

const GRID_GUTTER = '      ';
const STATUS_GUTTER = '   ';
const SPINNER_PREFIX_WIDTH = Cli.Fmt.Text.Width.measure('⠧ ');
const MAX_STATUS_ROWS = 2;
const MINUTE = Time.Date.MINUTE;

/** Format one deterministic progress frame from retained state and one immutable viewport. */
export function formatParallelProgress(args: ParallelProgressFormatArgs): string {
  return layoutParallelProgress(args).frame;
}

/** Project one progress frame and the failed-package actions it truthfully contains. */
export function layoutParallelProgress(args: ParallelProgressFormatArgs): ParallelProgressLayout {
  const failures = args.failures ?? [];
  const empty = (): ParallelProgressLayout => ({
    frame: '',
    completion: { failedPackages: { visible: 0, total: failures.length } },
  });
  const bounded = args.viewport !== undefined;
  const width = bounded ? wrangle.dimension(args.viewport?.width) : Cli.Fmt.Text.Width.fit({
    width: args.width,
    terminal: args.terminal,
    fallbackWidth: 100,
    minWidth: 40,
  });
  const capacity = bounded
    ? Math.max(
      0,
      wrangle.dimension(args.viewport?.height) - wrangle.dimension(args.cursorRows ?? 0),
    )
    : Num.MAX_INT;
  if (width <= 0 || capacity <= 0) return empty();

  const status = wrangle.status(args, width, capacity, bounded);
  if (!status) return empty();

  const sections = { status, running: '', completed: '', failures: '' };
  let used = wrangle.physicalRows(status, width);

  // Allocate by semantic priority, then compose completed detail above the reserved failure index.

  const runningCapacity = wrangle.sectionCapacity(capacity, used);
  sections.running = wrangle.runningSection(
    args.running,
    wrangle.progressElapsed(args.elapsed),
    width,
    runningCapacity,
    args.terminal,
    bounded,
  );
  if (sections.running) used += 1 + wrangle.physicalRows(sections.running, width);

  const failureCapacity = wrangle.sectionCapacity(capacity, used);
  const failureSection = wrangle.failureSection(
    failures,
    width,
    failureCapacity,
    args.terminal,
    bounded,
  );
  sections.failures = failureSection.text;
  if (sections.failures) used += 1 + wrangle.physicalRows(sections.failures, width);

  const completedCapacity = wrangle.sectionCapacity(capacity, used);
  sections.completed = wrangle.completedSection(
    args,
    width,
    completedCapacity,
    args.terminal,
    bounded,
  );

  return {
    frame: [sections.status, sections.running, sections.completed, sections.failures]
      .filter(Boolean)
      .join('\n\n'),
    completion: {
      failedPackages: { visible: failureSection.visible, total: failures.length },
    },
  };
}

const wrangle = {
  status(
    args: ParallelProgressFormatArgs,
    width: number,
    capacity: number,
    bounded: boolean,
  ) {
    const summary = `${c.green(`✓ ${args.passed}`)}${c.gray(`/${args.runnableTotal} passed`)}`;
    const failed = args.failed > 0 ? c.red(`✕ failed ${args.failed}`) : c.gray('✕ failed 0');
    const blocked = args.blocked > 0
      ? c.yellow(`⊘ blocked ${args.blocked}`)
      : c.gray('⊘ blocked 0');
    const skipped = args.skipped > 0
      ? c.yellow(`↷ skipped ${args.skipped}`)
      : c.gray('↷ skipped 0');
    const full = wrangle.statusRows(
      summary,
      [
        c.cyan(`⦿ running ${args.running.length}`),
        c.gray(`○ pending ${args.pending}`),
        skipped,
        blocked,
        failed,
      ],
      width,
      args.terminal,
    );
    const fullRows = wrangle.physicalRows(full, width);
    if (!bounded || (fullRows <= capacity && fullRows <= MAX_STATUS_ROWS)) return full;

    const available = Math.max(0, width - (args.terminal ? SPINNER_PREFIX_WIDTH : 0));
    if (available <= 0) return '';
    const terse = [
      `✓${args.passed}/${args.runnableTotal}`,
      `⦿${args.running.length}`,
      `○${args.pending}`,
      `↷${args.skipped}`,
      `⊘${args.blocked}`,
      `✕${args.failed}`,
    ].join(' ');
    return c.gray(Cli.Fmt.Text.ellipsize(terse, available));
  },

  runningSection(
    running: readonly ParallelProgressRunning[],
    elapsed: string,
    width: number,
    capacity: number,
    terminal: boolean | undefined,
    bounded: boolean,
  ) {
    if (running.length === 0 || capacity <= 0) return '';
    const fallback = `  ${formatContinuationSummary(String(running.length), 'cyan', 'running')}`;
    const layout = wrangle.gridLayout(width);
    if (!layout) return wrangle.physicalRows(fallback, width) <= capacity ? fallback : '';
    const visibleLimit = bounded
      ? Math.min(running.length, capacity * layout.columns)
      : running.length;
    const cells = running
      .slice(0, visibleLimit)
      .map((item) => wrangle.runningCell(item, layout.cellWidth, terminal));
    const totalRows = Math.ceil(cells.length / layout.columns);
    const maxRows = bounded ? Math.min(totalRows, capacity) : totalRows;
    const context = wrangle.contextLine(elapsed, width);

    if (visibleLimit === running.length) {
      const grid = wrangle.grid(cells, layout.columns);
      const withContext = `${context}\n${grid}`;
      if (!bounded || wrangle.physicalRows(withContext, width) <= capacity) return withContext;
      if (wrangle.physicalRows(grid, width) <= capacity) return grid;
    } else {
      for (const includeContext of [true, false]) {
        for (let rowCount = maxRows; rowCount >= 1; rowCount -= 1) {
          const visibleCount = Math.min(cells.length, rowCount * layout.columns);
          const grid = wrangle.grid(cells.slice(0, visibleCount), layout.columns);
          const hidden = running.length - visibleCount;
          const suffix = `  ${formatContinuationSummary(String(hidden), 'cyan', 'running')}`;
          const candidate = [includeContext ? context : '', grid, suffix]
            .filter(Boolean)
            .join('\n');
          if (wrangle.physicalRows(candidate, width) <= capacity) return candidate;
        }
      }
    }

    return wrangle.physicalRows(fallback, width) <= capacity ? fallback : '';
  },

  failureSection(
    failures: readonly FailedPackage[],
    width: number,
    capacity: number,
    terminal: boolean | undefined,
    bounded: boolean,
  ): FailureSection {
    if (failures.length === 0 || capacity <= 0) return { text: '', visible: 0 };
    if (!bounded) {
      return {
        text: formatFailedPackageIndex(failures, { width, terminal }),
        visible: failures.length,
      };
    }

    const maxVisible = Math.min(failures.length, capacity);
    const items = failures.slice(0, maxVisible).map((failure) => {
      return formatFailedPackageIndex([failure], { width, terminal });
    });
    for (let visible = items.length; visible >= 0; visible -= 1) {
      const hidden = failures.length - visible;
      const suffix = hidden > 0 ? wrangle.failureOverflow(hidden) : '';
      const candidate = [items.slice(0, visible).join('\n\n'), suffix]
        .filter(Boolean)
        .join('\n');
      if (candidate && wrangle.physicalRows(candidate, width) <= capacity) {
        return { text: candidate, visible };
      }
    }
    return { text: '', visible: 0 };
  },

  failureOverflow(hidden: number) {
    const qualifier = `failed ${Str.plural(hidden, 'package')}`;
    return `  ${formatContinuationSummary(String(hidden), 'red', qualifier)}`;
  },

  completedSection(
    args: ParallelProgressFormatArgs,
    width: number,
    capacity: number,
    terminal: boolean | undefined,
    bounded: boolean,
  ) {
    const completed = args.completed ?? [];
    if (completed.length === 0 || capacity <= 0) return '';
    const layout = wrangle.gridLayout(width);
    const done = args.passed + args.blockedRunnable + args.failed;
    const rule = Cli.Fmt.hr({
      width,
      color: wrangle.completedSeverityColor(completed),
      progress: wrangle.progressRatio(done, args.runnableTotal),
    });
    if (!layout) {
      const suffix = `  ${wrangle.completedOverflowSuffix(completed)}`;
      return wrangle.physicalRows(suffix, width) <= capacity ? suffix : '';
    }

    const totalRows = Math.ceil(completed.length / layout.columns);
    const maxRows = bounded ? Math.min(totalRows, capacity) : Math.min(5, totalRows);
    for (let rowCount = maxRows; rowCount >= 1; rowCount -= 1) {
      const visibleCount = Math.min(completed.length, rowCount * layout.columns);
      const visible = completed.slice(0, visibleCount);
      const hidden = completed.slice(visibleCount);
      const cells = visible.map((item) => wrangle.completedCell(item, layout.cellWidth, terminal));
      const grid = wrangle.grid(cells, layout.columns);
      const suffix = hidden.length > 0 ? `  ${wrangle.completedOverflowSuffix(hidden)}` : '';
      const candidate = [rule, grid, suffix].filter(Boolean).join('\n');
      if (!bounded || wrangle.physicalRows(candidate, width) <= capacity) return candidate;
    }

    const suffix = `  ${wrangle.completedOverflowSuffix(completed)}`;
    const withRule = `${rule}\n${suffix}`;
    if (wrangle.physicalRows(withRule, width) <= capacity) return withRule;
    return wrangle.physicalRows(suffix, width) <= capacity ? suffix : '';
  },

  sectionCapacity(total: number, used: number) {
    return Math.max(0, total - used - 1);
  },

  physicalRows(input: string, width: number) {
    if (!input || width <= 0) return 0;
    return input.split('\n').reduce((total, line) => {
      const cells = Cli.Fmt.Text.Width.measure(line);
      return total + Math.max(1, Math.ceil(cells / width));
    }, 0);
  },

  dimension(input?: number) {
    return Num.Is.finite(input) ? Math.max(0, Math.floor(input)) : 0;
  },

  progressRatio(done: number, total: number): t.Percent {
    if (total < 1) return 1;
    return Num.Percent.clamp(done / total);
  },

  progressElapsed(elapsed?: t.Msecs) {
    if (elapsed === undefined || elapsed < 1000) return '';
    if (elapsed < MINUTE) return Time.duration(elapsed).format('s');
    return Time.duration(elapsed).format({ unit: 'm', round: 1 });
  },

  runningElapsed(elapsed: t.Msecs) {
    if (elapsed < MINUTE) return Time.duration(elapsed).toString();
    const minutes = Num.round(elapsed / MINUTE, 1);
    return `${minutes.toFixed(1)}m`;
  },

  contextLine(elapsed: string, width: number) {
    const label = c.gray('testing');
    const schedule = c.dim(c.gray('(--schedule=topological)'));
    const elapsedSuffix = elapsed
      ? ` ${c.gray('·')} ${c.gray(c.italic(`${elapsed} elapsed`))}`
      : '';
    const full = `  ${label} ${schedule}${elapsedSuffix}`;
    const compact = elapsed ? `  ${label}${elapsedSuffix}` : `  ${label}`;
    const bare = `  ${label}`;
    return [full, compact, bare].find((line) => Cli.Fmt.Text.Width.measure(line) <= width) ?? bare;
  },

  statusRows(summary: string, metrics: readonly string[], width: number, terminal?: boolean) {
    const prefixWidth = terminal ? SPINNER_PREFIX_WIDTH : 0;
    const firstLineWidth = width - prefixWidth;
    const singleLine = [summary, ...metrics].join(STATUS_GUTTER);
    if (Cli.Fmt.Text.Width.measure(singleLine) <= firstLineWidth) return singleLine;

    const summaryWidth = Cli.Fmt.Text.Width.measure(summary);
    const gutterWidth = Cli.Fmt.Text.Width.measure(STATUS_GUTTER);
    const continuationIndent = ' '.repeat(summaryWidth + gutterWidth + prefixWidth);
    const lines: string[] = [];
    let current = summary;
    let isFirstLine = true;

    for (const metric of metrics) {
      const candidate = `${current}${STATUS_GUTTER}${metric}`;
      const rowWidth = isFirstLine ? firstLineWidth : width;
      if (Cli.Fmt.Text.Width.measure(candidate) <= rowWidth) {
        current = candidate;
        continue;
      }

      lines.push(current);
      current = `${continuationIndent}${metric}`;
      isFirstLine = false;
    }

    lines.push(current);
    return lines.join('\n');
  },

  gridLayout(width: number): GridLayout | undefined {
    const maxColumns = width >= 120 ? 3 : width >= 80 ? 2 : 1;
    const indent = '  ';
    const usable = width - Cli.Fmt.Text.Width.measure(indent);
    const columns = wrangle.runningColumnCount(maxColumns, usable, GRID_GUTTER);
    if (columns < 1) return undefined;
    return {
      columns,
      cellWidth: wrangle.runningCellWidth(usable, columns, GRID_GUTTER),
    };
  },

  grid(cells: readonly string[], columns: number) {
    const indent = '  ';
    const widths = wrangle.runningColumnWidths(cells, columns);
    const lines: string[] = [];
    for (let index = 0; index < cells.length; index += columns) {
      const row: string[] = [];
      for (let offset = 0; offset < columns; offset += 1) {
        const cell = cells[index + offset];
        if (!cell) continue;
        const isLast = index + offset + 1 >= cells.length || offset === columns - 1;
        row.push(isLast ? cell : Cli.Fmt.Text.Width.padEnd(cell, widths[offset] ?? 0));
      }
      lines.push(`${indent}${row.join(GRID_GUTTER)}`);
    }
    return lines.join('\n');
  },

  runningColumnCount(maxColumns: number, usable: number, gutter: string) {
    for (let columns = maxColumns; columns > 0; columns -= 1) {
      if (wrangle.runningCellWidth(usable, columns, gutter) >= 24) return columns;
    }
    return 0;
  },

  runningCellWidth(usable: number, columns: number, gutter: string) {
    const gutterWidth = Cli.Fmt.Text.Width.measure(gutter) * (columns - 1);
    const raw = (usable - gutterWidth) / columns;
    return raw - (raw % 1);
  },

  runningColumnWidths(cells: readonly string[], columns: number) {
    const widths: number[] = [];
    for (let index = 0; index < cells.length; index += 1) {
      const column = index % columns;
      const width = Cli.Fmt.Text.Width.measure(cells[index] ?? '');
      widths[column] = Math.max(widths[column] ?? 0, width);
    }
    return widths;
  },

  runningCell(item: ParallelProgressRunning, width: number, terminal?: boolean) {
    const elapsed = wrangle.runningElapsed(item.elapsed);
    const elapsedWidth = Cli.Fmt.Text.Width.measure(elapsed);
    const pathWidth = Num.clamp(8, width - 4, width - elapsedWidth - 4);
    const path = Cli.Fmt.Path.tty(item.path, {
      fit: 'width',
      width: pathWidth,
      min: 8,
      relative: 'bare',
      terminal,
    });
    return `${c.cyan('⦿')}  ${path} ${c.gray(elapsed)}`;
  },

  completedCell(item: ParallelProgressCompleted, width: number, terminal?: boolean) {
    const mark = wrangle.completedMark(item.kind);
    const suffix = wrangle.completedSuffix(item);
    const suffixWidth = Cli.Fmt.Text.Width.measure(suffix);
    const pathWidth = Num.clamp(8, width - 4, width - suffixWidth - 4);
    const path = Cli.Fmt.Path.tty(item.path, {
      fit: 'width',
      width: pathWidth,
      min: 8,
      relative: 'bare',
      terminal,
    });
    return `${mark}  ${path}${suffix}`;
  },

  completedSuffix(item: ParallelProgressCompleted) {
    const parts: string[] = [];
    const stats = wrangle.completedStats(item.testStats);
    if (stats) parts.push(stats);
    if (item.elapsed !== undefined) parts.push(c.gray(Time.duration(item.elapsed).toString()));
    return parts.length > 0 ? ` ${parts.join(c.gray(', '))}` : '';
  },

  completedStats(stats?: t.WorkspaceRun.Test.Stats.Result) {
    if (!stats) return '';
    if (stats.kind !== 'observed') return c.gray('—');
    const tests = c.gray(`${stats.tests} ${Str.plural(stats.tests, 'test')}`);
    const failed = stats.failed > 0 ? `${c.gray(', ')}${c.red(`${stats.failed} failed`)}` : '';
    return `${tests}${failed}`;
  },

  completedOverflowSuffix(hidden: readonly ParallelProgressCompleted[]) {
    const tone = wrangle.completedSeverityColor(hidden);
    return formatContinuationSummary(String(hidden.length), tone);
  },

  completedSeverityColor(items: readonly ParallelProgressCompleted[]) {
    let hasWarning = false;
    for (const item of items) {
      if (item.kind === 'failed') return 'red';
      if (item.kind === 'blocked' || item.kind === 'skipped') hasWarning = true;
    }
    return hasWarning ? 'yellow' : 'green';
  },

  completedMark(kind: ParallelProgressCompleted['kind']) {
    if (kind === 'passed') return c.green('✓');
    if (kind === 'failed') return c.red('✕');
    if (kind === 'blocked') return c.yellow('⊘');
    return c.gray('↷');
  },
} as const;
