import { c, Cli, Num, Str, type t, Time } from '../common.ts';
import { createFailedPackage, type FailedPackage } from './u.failure.ts';
import { formatFailedPackageIndex, formatIntroLine } from './u.fmt.ts';
import {
  createParallelProgressModel,
  type ParallelProgressCompleted,
  type ParallelProgressModel,
  type ParallelProgressRunning,
} from './u.progress.ts';
import type { ParallelRunEvent, ParallelRunEventHandler } from '../u.run/mod.ts';

export type ParallelReporter = {
  readonly start: () => void;
  readonly event: ParallelRunEventHandler;
  readonly stop: () => void;
};

export type ParallelReporterArgs = {
  task: t.WorkspaceRun.Task;
  jobs: number;
  runnablePaths: readonly t.StringPath[];
  terminal?: boolean;
  width?: number;
  write?: (line: string) => void;
  startSpinner?: (text: string) => t.Cli.Spinner.Instance;
};

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
};

type ReporterState = {
  readonly task: t.WorkspaceRun.Task;
  readonly jobs: number;
  readonly terminal: boolean;
  readonly width?: number;
  readonly write: (line: string) => void;
  readonly startSpinner: (text: string) => t.Cli.Spinner.Instance;
  readonly progress: ParallelProgressModel;
  spinner?: t.Cli.Spinner.Instance;
  tick?: t.Time.Interval.Handle;
  stopped: boolean;
};

const GRID_GUTTER = '      ';
const STATUS_GUTTER = '   ';
const SPINNER_PREFIX_WIDTH = Cli.Fmt.Text.Width.measure('⠧ ');
const MINUTE = Time.Date.MINUTE;

/** Create a reporter that renders parallel test progress from scheduler events. */
export function createParallelReporter(args: ParallelReporterArgs): ParallelReporter {
  const state: ReporterState = {
    task: args.task,
    jobs: args.jobs,
    terminal: args.terminal ?? Cli.Is.terminal('stdout'),
    width: args.width,
    write: args.write ?? console.info,
    startSpinner: args.startSpinner ?? ((text) => Cli.Spinner.start(text)),
    progress: createParallelProgressModel({ runnablePaths: args.runnablePaths }),
    stopped: false,
  };

  return {
    start() {
      state.write(
        formatIntroLine(
          `workspace ${state.task}`,
          `strategy: parallel, ${state.jobs} ${Str.plural(state.jobs, 'job')} (concurrent)`,
        ),
      );
      if (!state.terminal) return;
      state.write('');
      state.spinner = state.startSpinner(wrangle.frame(state));
      state.tick = Time.interval(1000, () => wrangle.render(state));
    },

    event(event) {
      wrangle.event(state, event);
    },

    stop() {
      wrangle.stop(state);
    },
  };
}

/** Format one deterministic progress frame for terminal reporter output. */
export function formatParallelProgress(args: ParallelProgressFormatArgs): string {
  const done = args.passed + args.blockedRunnable + args.failed;
  const elapsed = wrangle.progressElapsed(args.elapsed);
  const summary = `${c.green(`✓ ${args.passed}`)}${c.gray(`/${args.runnableTotal} passed`)}`;
  const failed = args.failed > 0 ? c.red(`✕ failed ${args.failed}`) : c.gray('✕ failed 0');
  const blocked = args.blocked > 0 ? c.yellow(`⊘ blocked ${args.blocked}`) : c.gray('⊘ blocked 0');
  const skipped = args.skipped > 0 ? c.yellow(`↷ skipped ${args.skipped}`) : c.gray('↷ skipped 0');
  const width = Cli.Fmt.Text.Width.fit({
    width: args.width,
    terminal: args.terminal,
    fallbackWidth: 100,
    minWidth: 40,
  });
  const line = wrangle.statusRows(
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
  const sections: string[] = [];

  if (width > 0 && args.running.length > 0) {
    const running = wrangle.runningGrid(args.running, width, args.terminal);
    if (running) {
      sections.push(`${wrangle.contextLine(elapsed, width)}\n${running}`);
    }
  }

  if (width > 0 && args.completed && args.completed.length > 0) {
    const completed = wrangle.completedGrid(args.completed, width, args.terminal);
    if (completed) {
      const rule = Cli.Fmt.hr({
        width,
        color: wrangle.completedSeverityColor(args.completed),
        progress: wrangle.progressRatio(done, args.runnableTotal),
      });
      sections.push(`${rule}\n${completed}`);
    }
  }

  if (args.failures && args.failures.length > 0) {
    const failureIndex = formatFailedPackageIndex(args.failures, {
      width,
      terminal: args.terminal,
    });
    if (failureIndex) sections.push(failureIndex);
  }

  const body = sections.length > 0 ? `\n\n${sections.join('\n\n')}` : '';
  return Str.trimEdgeNewlines(`${line}${body}`);
}

const wrangle = {
  event(state: ReporterState, event: ParallelRunEvent) {
    if (state.stopped) return;

    state.progress.event(event);
    wrangle.render(state);
    if (event.kind === 'done') wrangle.stop(state);
  },

  render(state: ReporterState) {
    if (state.stopped || !state.terminal || !state.spinner) return;
    state.spinner.text = wrangle.frame(state);
  },

  frame(state: ReporterState) {
    const snapshot = state.progress.snapshot();
    return formatParallelProgress({
      ...snapshot,
      failures: snapshot.failedPackages.map((item) => createFailedPackage(item, state.task)),
      terminal: state.terminal,
      width: state.width,
    });
  },

  stop(state: ReporterState) {
    if (state.stopped) return;
    state.stopped = true;
    state.tick?.cancel();
    state.tick = undefined;
    state.spinner?.stop();
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
    const variants = [full, compact, bare];
    return variants.find((line) => Cli.Fmt.Text.Width.measure(line) <= width) ?? bare;
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
      const capacity = isFirstLine ? firstLineWidth : width;
      if (Cli.Fmt.Text.Width.measure(candidate) <= capacity) {
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

  runningGrid(
    running: readonly ParallelProgressRunning[],
    width: number,
    terminal?: boolean,
  ) {
    const layout = wrangle.gridLayout(width);
    if (!layout) return '';
    const cells = running.map((item) => wrangle.runningCell(item, layout.cellWidth, terminal));
    return wrangle.grid(cells, layout.columns);
  },

  completedGrid(
    completed: readonly ParallelProgressCompleted[],
    width: number,
    terminal?: boolean,
  ) {
    const layout = wrangle.gridLayout(width);
    if (!layout) return '';
    const visibleCount = layout.columns * 5;
    const visible = completed.slice(0, visibleCount);
    const hidden = completed.slice(visibleCount);
    const cells = visible.map((item) => wrangle.completedCell(item, layout.cellWidth, terminal));
    const grid = wrangle.grid(cells, layout.columns);
    if (hidden.length <= 0) return grid;
    const suffix = wrangle.completedOverflowSuffix(hidden);
    return grid ? `${grid}\n  ${suffix}` : `  ${suffix}`;
  },

  completedOverflowSuffix(hidden: readonly ParallelProgressCompleted[]) {
    return [
      c.gray(c.italic('...and ')),
      wrangle.completedOverflowCount(hidden),
      c.gray(c.italic(' more')),
    ].join('');
  },

  completedOverflowCount(hidden: readonly ParallelProgressCompleted[]) {
    const value = c.italic(String(hidden.length));
    const color = wrangle.completedSeverityColor(hidden);
    if (color === 'red') return c.red(value);
    if (color === 'yellow') return c.yellow(value);
    return c.green(value);
  },

  completedSeverityColor(items: readonly ParallelProgressCompleted[]) {
    let hasWarning = false;
    for (const item of items) {
      if (item.kind === 'failed') return 'red';
      if (item.kind === 'blocked' || item.kind === 'skipped') hasWarning = true;
    }
    return hasWarning ? 'yellow' : 'green';
  },

  gridLayout(width: number) {
    const maxColumns = width >= 120 ? 3 : width >= 80 ? 2 : 1;
    const indent = '  ';
    const gutter = GRID_GUTTER;
    const usable = width - Cli.Fmt.Text.Width.measure(indent);
    const columns = wrangle.runningColumnCount(maxColumns, usable, gutter);
    if (columns < 1) return undefined;
    return {
      columns,
      cellWidth: wrangle.runningCellWidth(usable, columns, gutter),
    };
  },

  grid(cells: readonly string[], columns: number) {
    const indent = '  ';
    const gutter = GRID_GUTTER;
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
      lines.push(`${indent}${row.join(gutter)}`);
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
      const current = widths[column] ?? 0;
      widths[column] = width > current ? width : current;
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

  completedMark(kind: ParallelProgressCompleted['kind']) {
    if (kind === 'passed') return c.green('✓');
    if (kind === 'failed') return c.red('✕');
    if (kind === 'blocked') return c.yellow('⊘');
    return c.gray('↷');
  },
} as const;
