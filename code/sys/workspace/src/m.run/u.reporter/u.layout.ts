import { c, Cli, Num, Str, type t, Time } from '../common.ts';
import { formatContinuationSummary } from '../u.fmt/u.continuation.ts';
import { formatFailedPackageIndex, formatFailedPackageSeparator } from '../u.fmt/mod.ts';
import type { FailedPackage } from '../u/u.failure.ts';
import type { ParallelProgressCompleted, ParallelProgressRunning } from '../u/u.progress.ts';
import {
  completedOverflowSummary,
  completedSeverityColor,
  formatCompletedCell,
  formatCompletedReporterGrid,
  formatReporterGrid,
  formatRunningCell,
  reporterGridLayout,
} from './u.grid.ts';
import { layoutFinalScrollback } from './u.scrollback.ts';

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
  /** Render exhaustive final scrollback instead of bounded active progress. */
  complete?: boolean;
};

export type ParallelProgressLayout = {
  readonly frame: string;
  readonly completion: t.WorkspaceRun.Test.Reporter.ScreenCompletion;
};

type FailureSection = {
  readonly text: string;
  readonly visible: number;
};

const STATUS_GUTTER = '   ';
const SPINNER_PREFIX_WIDTH = Cli.Fmt.Text.Width.measure('⠧ ');
const MAX_STATUS_ROWS = 2;
const MINUTE = Time.Date.MINUTE;

/** Format one deterministic active frame or final scrollback projection. */
export function formatParallelProgress(args: ParallelProgressFormatArgs): string {
  return layoutParallelProgress(args).frame;
}

/** Project active progress or exhaustive final screen scrollback. */
export function layoutParallelProgress(args: ParallelProgressFormatArgs): ParallelProgressLayout {
  const failures = args.failures ?? [];
  const empty = (): ParallelProgressLayout => ({
    frame: '',
    completion: { failedPackages: { visible: 0, total: failures.length } },
  });
  const bounded = args.viewport !== undefined;
  const width = bounded ? dimension(args.viewport?.width) : Cli.Fmt.Text.Width.fit({
    width: args.width,
    terminal: args.terminal,
    fallbackWidth: 100,
    minWidth: 40,
  });
  if (width <= 0) return empty();
  if (args.complete) {
    return layoutFinalScrollback({
      completed: args.completed ?? [],
      failures,
      terminal: args.terminal,
      width,
    });
  }

  const capacity = bounded
    ? Math.max(0, dimension(args.viewport?.height) - dimension(args.cursorRows ?? 0))
    : Num.MAX_INT;
  if (capacity <= 0) return empty();

  const status = formatStatus(args, width, capacity, bounded);
  if (!status) return empty();

  let used = physicalRows(status, width);

  // Allocate by semantic priority, then compose completed detail above the reserved failure index.
  const running = formatRunningSection(
    args.running,
    formatProgressElapsed(args.elapsed),
    width,
    sectionCapacity(capacity, used),
    bounded,
  );
  if (running) used += 1 + physicalRows(running, width);

  const failureSection = formatFailureSection(
    failures,
    width,
    sectionCapacity(capacity, used),
    args.terminal,
    bounded,
  );
  if (failureSection.text) used += 1 + physicalRows(failureSection.text, width);

  const completed = formatCompletedSection(
    args,
    width,
    sectionCapacity(capacity, used),
    bounded,
  );
  const progress = [status, running, completed].filter(Boolean).join('\n\n');
  const frame = failureSection.text
    ? [progress, formatFailedPackageSeparator(width), failureSection.text].filter(Boolean).join(
      '\n',
    )
    : progress;

  return {
    frame,
    completion: {
      failedPackages: { visible: failureSection.visible, total: failures.length },
    },
  };
}

function formatStatus(
  args: ParallelProgressFormatArgs,
  width: number,
  capacity: number,
  bounded: boolean,
) {
  const summary = `${c.green(`✓ ${args.passed}`)}${c.gray(`/${args.runnableTotal} passed`)}`;
  const failed = args.failed > 0 ? c.red(`✕ failed ${args.failed}`) : c.gray('✕ failed 0');
  const blocked = args.blocked > 0 ? c.yellow(`⊘ blocked ${args.blocked}`) : c.gray('⊘ blocked 0');
  const skipped = args.skipped > 0 ? c.yellow(`↷ skipped ${args.skipped}`) : c.gray('↷ skipped 0');
  const full = formatStatusRows(
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
  const fullRows = physicalRows(full, width);
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
}

function formatRunningSection(
  running: readonly ParallelProgressRunning[],
  elapsed: string,
  width: number,
  capacity: number,
  bounded: boolean,
) {
  if (running.length === 0 || capacity <= 0) return '';
  const fallback = `  ${formatContinuationSummary(String(running.length), 'cyan', 'running')}`;
  const layout = reporterGridLayout(width);
  if (!layout) return physicalRows(fallback, width) <= capacity ? fallback : '';
  const visibleLimit = bounded
    ? Math.min(running.length, capacity * layout.columns)
    : running.length;
  const cells = running
    .slice(0, visibleLimit)
    .map((item) => formatRunningCell(item, layout.cellWidth));
  const totalRows = Math.ceil(cells.length / layout.columns);
  const maxRows = bounded ? Math.min(totalRows, capacity) : totalRows;
  const context = formatContextLine(elapsed, width);

  if (visibleLimit === running.length) {
    const grid = formatReporterGrid(cells, layout.columns);
    const withContext = `${context}\n${grid}`;
    if (!bounded || physicalRows(withContext, width) <= capacity) return withContext;
    if (physicalRows(grid, width) <= capacity) return grid;
  } else {
    for (const includeContext of [true, false]) {
      for (let rowCount = maxRows; rowCount >= 1; rowCount -= 1) {
        const visibleCount = Math.min(cells.length, rowCount * layout.columns);
        const grid = formatReporterGrid(cells.slice(0, visibleCount), layout.columns);
        const hidden = running.length - visibleCount;
        const suffix = `  ${formatContinuationSummary(String(hidden), 'cyan', 'running')}`;
        const candidate = [includeContext ? context : '', grid, suffix]
          .filter(Boolean)
          .join('\n');
        if (physicalRows(candidate, width) <= capacity) return candidate;
      }
    }
  }

  return physicalRows(fallback, width) <= capacity ? fallback : '';
}

function formatFailureSection(
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
    const suffix = hidden > 0 ? formatFailureOverflow(hidden) : '';
    const candidate = [items.slice(0, visible).join('\n\n'), suffix]
      .filter(Boolean)
      .join('\n');
    if (candidate && physicalRows(candidate, width) <= capacity) {
      return { text: candidate, visible };
    }
  }
  return { text: '', visible: 0 };
}

function formatFailureOverflow(hidden: number) {
  const qualifier = `failed ${Str.plural(hidden, 'package')}`;
  return `  ${formatContinuationSummary(String(hidden), 'red', qualifier)}`;
}

function formatCompletedSection(
  args: ParallelProgressFormatArgs,
  width: number,
  capacity: number,
  bounded: boolean,
) {
  const completed = args.completed ?? [];
  if (completed.length === 0 || capacity <= 0) return '';
  const layout = reporterGridLayout(width);
  const done = args.passed + args.blockedRunnable + args.failed;
  const rule = Cli.Fmt.hr({
    width,
    color: completedSeverityColor(completed),
    progress: progressRatio(done, args.runnableTotal),
  });
  if (!layout) {
    const suffix = `  ${completedOverflowSummary(completed)}`;
    return physicalRows(suffix, width) <= capacity ? suffix : '';
  }

  const maxRows = bounded ? Math.min(completed.length, capacity) : Math.min(completed.length, 5);
  for (let rowCount = maxRows; rowCount >= 1; rowCount -= 1) {
    const visibleCount = Math.min(completed.length, rowCount * layout.columns);
    const visible = completed.slice(0, visibleCount);
    const hidden = completed.slice(visibleCount);
    const cells = visible.map((item) => formatCompletedCell(item, layout.cellWidth));
    const grid = formatCompletedReporterGrid(cells, layout.columns, rowCount);
    const suffix = hidden.length > 0 ? `  ${completedOverflowSummary(hidden)}` : '';
    const candidate = [rule, grid, suffix].filter(Boolean).join('\n');
    if (!bounded || physicalRows(candidate, width) <= capacity) return candidate;
  }

  const suffix = `  ${completedOverflowSummary(completed)}`;
  const withRule = `${rule}\n${suffix}`;
  if (physicalRows(withRule, width) <= capacity) return withRule;
  return physicalRows(suffix, width) <= capacity ? suffix : '';
}

function sectionCapacity(total: number, used: number) {
  return Math.max(0, total - used - 1);
}

function physicalRows(input: string, width: number) {
  if (!input || width <= 0) return 0;
  return input.split('\n').reduce((total, line) => {
    const cells = Cli.Fmt.Text.Width.measure(line);
    return total + Math.max(1, Math.ceil(cells / width));
  }, 0);
}

function dimension(input?: number) {
  return Num.Is.finite(input) ? Math.max(0, Math.floor(input)) : 0;
}

function progressRatio(done: number, total: number): t.Percent {
  if (total < 1) return 1;
  return Num.Percent.clamp(done / total);
}

function formatProgressElapsed(elapsed?: t.Msecs) {
  if (elapsed === undefined || elapsed < 1000) return '';
  if (elapsed < MINUTE) return Time.duration(elapsed).format('s');
  return Time.duration(elapsed).format({ unit: 'm', round: 1 });
}

function formatContextLine(elapsed: string, width: number) {
  const label = c.gray('testing');
  const schedule = c.dim(c.gray('(--schedule=topological)'));
  const elapsedSuffix = elapsed ? ` ${c.gray('·')} ${c.gray(c.italic(`${elapsed} elapsed`))}` : '';
  const full = `  ${label} ${schedule}${elapsedSuffix}`;
  const compact = elapsed ? `  ${label}${elapsedSuffix}` : `  ${label}`;
  const bare = `  ${label}`;
  return [full, compact, bare].find((line) => Cli.Fmt.Text.Width.measure(line) <= width) ?? bare;
}

function formatStatusRows(
  summary: string,
  metrics: readonly string[],
  width: number,
  terminal?: boolean,
) {
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
}
