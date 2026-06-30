import { c, Cli, Num, Str, type t, Time } from './common.ts';
import { formatFailedOutput } from './u.fmt.ts';
import type { ParallelRunEvent, ParallelRunEventHandler } from './u.run.parallel.ts';

export type ParallelReporter = {
  readonly start: () => void;
  readonly event: ParallelRunEventHandler;
  readonly stop: () => void;
};

export type ParallelReporterArgs = {
  readonly task: t.WorkspaceRun.Task;
  readonly jobs: number;
  readonly total: number;
  readonly terminal?: boolean;
  readonly width?: number;
  readonly write?: (line: string) => void;
};

export type ParallelProgressFormatArgs = {
  readonly total: number;
  readonly passed: number;
  readonly skipped: number;
  readonly blocked: number;
  readonly failed: number;
  readonly pending: number;
  readonly running: readonly ParallelProgressRunning[];
  readonly terminal?: boolean;
  readonly width?: number;
};

export type ParallelProgressRunning = {
  readonly path: t.StringPath;
  readonly elapsed: t.Msecs;
};

type Running = {
  readonly path: t.StringPath;
  readonly startedAt: t.Msecs;
};

type ReporterState = {
  readonly task: t.WorkspaceRun.Task;
  readonly jobs: number;
  readonly total: number;
  readonly terminal: boolean;
  readonly width?: number;
  readonly write: (line: string) => void;
  readonly running: Map<t.StringPath, Running>;
  pending: number;
  passed: number;
  skipped: number;
  blocked: number;
  failed: number;
  spinner?: t.CliSpinner.Instance;
  stopped: boolean;
};

/** Create a reporter that renders parallel test progress from scheduler events. */
export function createParallelReporter(args: ParallelReporterArgs): ParallelReporter {
  const state: ReporterState = {
    task: args.task,
    jobs: args.jobs,
    total: args.total,
    terminal: args.terminal ?? Cli.Is.terminal('stdout'),
    width: args.width,
    write: args.write ?? console.info,
    running: new Map(),
    pending: args.total,
    passed: 0,
    skipped: 0,
    blocked: 0,
    failed: 0,
    stopped: false,
  };

  return {
    start() {
      state.write(`workspace ${state.task} → strategy parallel, jobs ${state.jobs}`);
      if (!state.terminal) return;
      state.spinner = Cli.Spinner.start(wrangle.frame(state));
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
  const done = args.passed + args.skipped + args.blocked + args.failed;
  const percent = wrangle.percent(done, args.total);
  const failed = args.failed > 0 ? c.red(`✕ failed ${args.failed}`) : c.gray('✕ failed 0');
  const blocked = args.blocked > 0 ? c.yellow(`⊘ blocked ${args.blocked}`) : c.gray('⊘ blocked 0');
  const skipped = args.skipped > 0 ? c.yellow(`· skipped ${args.skipped}`) : c.gray('· skipped 0');
  const line = [
    c.green(`✓ passed ${args.passed}`),
    c.cyan(`⦿ running ${args.running.length}`),
    c.gray(`◦ pending ${args.pending}`),
    skipped,
    blocked,
    failed,
    c.gray(`done ${percent}%`),
  ].join('   ');

  if (args.running.length === 0) return line;

  const width = Cli.Fmt.Text.fitWidth({
    width: args.width,
    terminal: args.terminal,
    fallbackWidth: 100,
    minWidth: 40,
  });
  if (width <= 0) return line;

  const active = wrangle.activeGrid(args.running, width, args.terminal);
  if (!active) return line;

  return Str.trimEdgeNewlines(`${line}\n\n${c.gray('active')}\n${active}`);
}

const wrangle = {
  event(state: ReporterState, event: ParallelRunEvent) {
    if (state.stopped && event.kind !== 'done') return;

    if (event.kind === 'start') {
      state.pending = wrangle.decrement(state.pending);
      state.running.set(event.path, { path: event.path, startedAt: Time.now.timestamp });
      wrangle.render(state);
      return;
    }

    if (event.kind === 'skip') {
      state.pending = wrangle.decrement(state.pending);
      state.skipped += 1;
      wrangle.render(state);
      return;
    }

    if (event.kind === 'finish') {
      state.running.delete(event.path);
      if (event.result.success) state.passed += 1;
      else state.failed += 1;
      wrangle.render(state);
      return;
    }

    if (event.kind === 'block') {
      state.pending = wrangle.decrement(state.pending);
      state.blocked += 1;
      wrangle.render(state);
      return;
    }

    wrangle.render(state);
    wrangle.stop(state);
    const failedOutput = formatFailedOutput(event.result);
    if (failedOutput) state.write(failedOutput);
  },

  render(state: ReporterState) {
    if (!state.terminal || !state.spinner) return;
    state.spinner.text = wrangle.frame(state);
  },

  frame(state: ReporterState) {
    return formatParallelProgress({
      total: state.total,
      passed: state.passed,
      skipped: state.skipped,
      blocked: state.blocked,
      failed: state.failed,
      pending: state.pending,
      running: wrangle.running(state),
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

  stop(state: ReporterState) {
    if (state.stopped) return;
    state.stopped = true;
    state.spinner?.stop();
  },

  decrement(value: number) {
    return value > 0 ? value - 1 : 0;
  },

  percent(done: number, total: number) {
    if (total < 1) return 100;
    const value = done * 100;
    return (value - (value % total)) / total;
  },

  activeGrid(
    running: readonly ParallelProgressRunning[],
    width: number,
    terminal?: boolean,
  ) {
    const columns = width >= 120 ? 3 : width >= 80 ? 2 : 1;
    const indent = '  ';
    const gutter = '   ';
    const usable = width - Cli.Fmt.Text.visibleWidth(indent);
    const gutterWidth = Cli.Fmt.Text.visibleWidth(gutter) * (columns - 1);
    const rawCellWidth = (usable - gutterWidth) / columns;
    const cellWidth = rawCellWidth - (rawCellWidth % 1);
    if (cellWidth < 24) return '';

    const lines: string[] = [];
    for (let index = 0; index < running.length; index += columns) {
      const cells: string[] = [];
      for (let offset = 0; offset < columns; offset += 1) {
        const item = running[index + offset];
        if (!item) continue;
        cells.push(wrangle.activeCell(item, cellWidth, terminal));
      }
      lines.push(`${indent}${cells.join(gutter)}`);
    }
    return lines.join('\n');
  },

  activeCell(item: ParallelProgressRunning, cellWidth: number, terminal?: boolean) {
    const elapsed = Time.duration(item.elapsed).toString();
    const elapsedWidth = Cli.Fmt.Text.visibleWidth(elapsed);
    const pathWidth = Num.clamp(8, cellWidth - 6, cellWidth - elapsedWidth - 5);
    const path = Cli.Fmt.Path.tty(item.path, {
      fit: 'width',
      width: pathWidth,
      min: 8,
      relative: 'bare',
      terminal,
    });
    const cell = `${c.cyan('⦿')} ${path} ${c.gray(elapsed)}`;
    return Cli.Fmt.Text.padEnd(cell, cellWidth);
  },
} as const;
