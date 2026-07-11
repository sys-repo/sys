import { c, Cli, Num, Str, type t, Time } from './common.ts';
import { formatFailedOutput, formatIntroLine } from './u.fmt.ts';
import type { ParallelRunEvent, ParallelRunEventHandler } from './u.run.parallel.ts';

export type ParallelReporter = {
  readonly start: () => void;
  readonly event: ParallelRunEventHandler;
  readonly stop: () => void;
};

export type ParallelReporterArgs = {
  readonly task: t.WorkspaceRun.Task;
  readonly jobs: number;
  readonly runnablePaths: readonly t.StringPath[];
  readonly terminal?: boolean;
  readonly width?: number;
  readonly write?: (line: string) => void;
};

export type ParallelProgressFormatArgs = {
  readonly runnableTotal: number;
  readonly passed: number;
  readonly skipped: number;
  readonly blocked: number;
  readonly blockedRunnable: number;
  readonly failed: number;
  readonly pending: number;
  readonly running: readonly ParallelProgressRunning[];
  readonly completed?: readonly ParallelProgressCompleted[];
  readonly elapsed?: t.Msecs;
  readonly terminal?: boolean;
  readonly width?: number;
};

export type ParallelProgressRunning = {
  readonly path: t.StringPath;
  readonly elapsed: t.Msecs;
};

export type ParallelProgressCompleted = {
  readonly path: t.StringPath;
  readonly kind: 'passed' | 'failed' | 'skipped' | 'blocked';
  readonly elapsed?: t.Msecs;
};

type Running = {
  readonly path: t.StringPath;
  readonly startedAt: t.Msecs;
};

type ReporterState = {
  readonly task: t.WorkspaceRun.Task;
  readonly jobs: number;
  readonly runnableTotal: number;
  readonly runnablePaths: Set<t.StringPath>;
  readonly terminal: boolean;
  readonly width?: number;
  readonly write: (line: string) => void;
  readonly startedAt: t.Msecs;
  readonly running: Map<t.StringPath, Running>;
  completed: ParallelProgressCompleted[];
  pending: number;
  passed: number;
  skipped: number;
  blocked: number;
  blockedRunnable: number;
  failed: number;
  spinner?: t.Cli.Spinner.Instance;
  tick?: ReturnType<typeof setInterval>;
  stopped: boolean;
};

const GRID_GUTTER = '      ';
const STATUS_GUTTER = '   ';
const SPINNER_PREFIX_WIDTH = Cli.Fmt.Text.visibleWidth('⠧ ');

/** Create a reporter that renders parallel test progress from scheduler events. */
export function createParallelReporter(args: ParallelReporterArgs): ParallelReporter {
  const runnablePaths = new Set(args.runnablePaths);
  const state: ReporterState = {
    task: args.task,
    jobs: args.jobs,
    runnableTotal: runnablePaths.size,
    runnablePaths,
    terminal: args.terminal ?? Cli.Is.terminal('stdout'),
    width: args.width,
    write: args.write ?? console.info,
    startedAt: Time.now.timestamp,
    running: new Map(),
    completed: [],
    pending: runnablePaths.size,
    passed: 0,
    skipped: 0,
    blocked: 0,
    blockedRunnable: 0,
    failed: 0,
    stopped: false,
  };

  return {
    start() {
      state.write(
        formatIntroLine(`workspace ${state.task}`, `strategy parallel, jobs ${state.jobs}`),
      );
      if (!state.terminal) return;
      state.write('');
      state.spinner = Cli.Spinner.start(wrangle.frame(state));
      state.tick = setInterval(() => wrangle.render(state), 1000);
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
  const skipped = args.skipped > 0 ? c.yellow(`· skipped ${args.skipped}`) : c.gray('· skipped 0');
  const width = Cli.Fmt.Text.fitWidth({
    width: args.width,
    terminal: args.terminal,
    fallbackWidth: 100,
    minWidth: 40,
  });
  const line = wrangle.statusRows(
    summary,
    [
      c.cyan(`⦿ running ${args.running.length}`),
      c.gray(`◦ pending ${args.pending}`),
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

  const body = sections.length > 0 ? `\n\n${sections.join('\n\n')}` : '';
  return Str.trimEdgeNewlines(`${line}${body}`);
}

const wrangle = {
  event(state: ReporterState, event: ParallelRunEvent) {
    if (state.stopped && event.kind !== 'done') return;

    if (event.kind === 'start') {
      if (wrangle.isRunnable(state, event.path)) state.pending = wrangle.decrement(state.pending);
      state.running.set(event.path, { path: event.path, startedAt: Time.now.timestamp });
      wrangle.render(state);
      return;
    }

    if (event.kind === 'skip') {
      state.skipped += 1;
      wrangle.addCompleted(state, { kind: 'skipped', path: event.path });
      wrangle.render(state);
      return;
    }

    if (event.kind === 'finish') {
      state.running.delete(event.path);
      if (event.result.success) state.passed += 1;
      else state.failed += 1;
      wrangle.addCompleted(state, {
        kind: event.result.success ? 'passed' : 'failed',
        path: event.path,
        elapsed: event.result.elapsed,
      });
      wrangle.render(state);
      return;
    }

    if (event.kind === 'block') {
      state.blocked += 1;
      if (wrangle.isRunnable(state, event.path)) {
        state.pending = wrangle.decrement(state.pending);
        state.blockedRunnable += 1;
      }
      wrangle.addCompleted(state, { kind: 'blocked', path: event.path });
      wrangle.render(state);
      return;
    }

    wrangle.render(state);
    wrangle.stop(state);
    const failedOutput = formatFailedOutput(event.result);
    if (failedOutput) state.write(failedOutput);
  },

  render(state: ReporterState) {
    if (state.stopped || !state.terminal || !state.spinner) return;
    state.spinner.text = wrangle.frame(state);
  },

  frame(state: ReporterState) {
    return formatParallelProgress({
      runnableTotal: state.runnableTotal,
      passed: state.passed,
      skipped: state.skipped,
      blocked: state.blocked,
      blockedRunnable: state.blockedRunnable,
      failed: state.failed,
      pending: state.pending,
      running: wrangle.running(state),
      completed: state.completed,
      elapsed: wrangle.elapsed(state),
      terminal: state.terminal,
      width: state.width,
    });
  },

  running(state: ReporterState): readonly ParallelProgressRunning[] {
    const now = Time.now.timestamp;
    const items: ParallelProgressRunning[] = [];
    for (const item of state.running.values()) {
      items.push({ path: item.path, elapsed: now - item.startedAt });
    }
    return items;
  },

  elapsed(state: ReporterState): t.Msecs {
    return (Time.now.timestamp - state.startedAt) as t.Msecs;
  },

  stop(state: ReporterState) {
    if (state.stopped) return;
    state.stopped = true;
    if (state.tick) clearInterval(state.tick);
    state.tick = undefined;
    state.spinner?.stop();
  },

  isRunnable(state: ReporterState, path: t.StringPath) {
    return state.runnablePaths.has(path);
  },

  addCompleted(state: ReporterState, item: ParallelProgressCompleted) {
    state.completed = [item, ...state.completed].slice(0, 64);
  },

  decrement(value: number) {
    return value > 0 ? value - 1 : 0;
  },

  progressRatio(done: number, total: number): t.Percent {
    if (total < 1) return 1;
    return Num.Percent.clamp(done / total);
  },

  progressElapsed(elapsed?: t.Msecs) {
    if (elapsed === undefined || elapsed < 1000) return '';
    if (elapsed < 60_000) return Time.duration(elapsed).format('s');
    return Time.duration(elapsed).format({ unit: 'm', round: 1 });
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
    return variants.find((line) => Cli.Fmt.Text.visibleWidth(line) <= width) ?? bare;
  },

  statusRows(summary: string, metrics: readonly string[], width: number, terminal?: boolean) {
    const prefixWidth = terminal ? SPINNER_PREFIX_WIDTH : 0;
    const firstLineWidth = width - prefixWidth;
    const singleLine = [summary, ...metrics].join(STATUS_GUTTER);
    if (Cli.Fmt.Text.visibleWidth(singleLine) <= firstLineWidth) return singleLine;

    const summaryWidth = Cli.Fmt.Text.visibleWidth(summary);
    const gutterWidth = Cli.Fmt.Text.visibleWidth(STATUS_GUTTER);
    const continuationIndent = ' '.repeat(summaryWidth + gutterWidth + prefixWidth);
    const lines: string[] = [];
    let current = summary;
    let isFirstLine = true;

    for (const metric of metrics) {
      const candidate = `${current}${STATUS_GUTTER}${metric}`;
      const capacity = isFirstLine ? firstLineWidth : width;
      if (Cli.Fmt.Text.visibleWidth(candidate) <= capacity) {
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
    const usable = width - Cli.Fmt.Text.visibleWidth(indent);
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
        row.push(isLast ? cell : Cli.Fmt.Text.padEnd(cell, widths[offset] ?? 0));
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
    const gutterWidth = Cli.Fmt.Text.visibleWidth(gutter) * (columns - 1);
    const raw = (usable - gutterWidth) / columns;
    return raw - (raw % 1);
  },

  runningColumnWidths(cells: readonly string[], columns: number) {
    const widths: number[] = [];
    for (let index = 0; index < cells.length; index += 1) {
      const column = index % columns;
      const width = Cli.Fmt.Text.visibleWidth(cells[index] ?? '');
      const current = widths[column] ?? 0;
      widths[column] = width > current ? width : current;
    }
    return widths;
  },

  runningCell(item: ParallelProgressRunning, width: number, terminal?: boolean) {
    const elapsed = Time.duration(item.elapsed).toString();
    const elapsedWidth = Cli.Fmt.Text.visibleWidth(elapsed);
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
    const elapsed = item.elapsed === undefined
      ? ''
      : ` ${c.gray(Time.duration(item.elapsed).toString())}`;
    const elapsedWidth = Cli.Fmt.Text.visibleWidth(elapsed);
    const pathWidth = Num.clamp(8, width - 4, width - elapsedWidth - 4);
    const path = Cli.Fmt.Path.tty(item.path, {
      fit: 'width',
      width: pathWidth,
      min: 8,
      relative: 'bare',
      terminal,
    });
    return `${mark}  ${path}${elapsed}`;
  },

  completedMark(kind: ParallelProgressCompleted['kind']) {
    if (kind === 'passed') return c.green('✓');
    if (kind === 'failed') return c.red('✕');
    if (kind === 'blocked') return c.yellow('⊘');
    return c.gray('·');
  },
} as const;
