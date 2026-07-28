import { Cli, Str, type t } from '../common.ts';
import { runCleanup } from './u.cleanup.ts';
import { createFailedPackage } from './u.failure.ts';
import { formatIntroLine } from './u.fmt.ts';
import { layoutParallelProgress } from './u.reporter.layout.ts';
import {
  createParallelReporterRuntime,
  type ParallelReporterRuntime,
  type ParallelReporterRuntimeDeps,
} from './u.reporter.runtime.ts';
import { createParallelProgressModel, type ParallelProgressModel } from './u.progress.ts';
import type { ParallelRunEventHandler } from '../u.run/mod.ts';

export { formatParallelProgress } from './u.reporter.layout.ts';
export type { ParallelProgressFormatArgs } from './u.reporter.layout.ts';

export type ParallelReporter = {
  readonly start: () => void;
  readonly event: ParallelRunEventHandler;
  readonly stop: () => void;
  /** Return failed-action visibility from the latest installed screen frame. */
  readonly completion: () => t.WorkspaceRun.Test.Reporter.ScreenCompletion | undefined;
};

export type ParallelReporterArgs = {
  task: t.WorkspaceRun.Task;
  jobs: number;
  runnablePaths: readonly t.StringPath[];
  terminal?: boolean;
  write?: (line: string) => void;
  deps?: ParallelReporterRuntimeDeps;
};

type ReporterState = {
  readonly task: t.WorkspaceRun.Task;
  readonly jobs: number;
  readonly terminal: boolean;
  readonly write: (line: string) => void;
  readonly progress: ParallelProgressModel;
  runtime?: ParallelReporterRuntime;
  completion?: t.WorkspaceRun.Test.Reporter.ScreenCompletion;
  started: boolean;
  stopped: boolean;
};

/** Create a reporter that renders parallel test progress from scheduler events. */
export function createParallelReporter(args: ParallelReporterArgs): ParallelReporter {
  const state: ReporterState = {
    task: args.task,
    jobs: args.jobs,
    terminal: args.terminal ?? Cli.Is.terminal('stdout'),
    write: args.write ?? console.info,
    progress: createParallelProgressModel({ runnablePaths: args.runnablePaths }),
    started: false,
    stopped: false,
  };

  if (state.terminal) {
    state.runtime = createParallelReporterRuntime({
      deps: args.deps,
      frame({ viewport, cursorRows }) {
        const snapshot = state.progress.snapshot();
        const layout = layoutParallelProgress({
          ...snapshot,
          failures: snapshot.failedPackages.map((item) => createFailedPackage(item, state.task)),
          terminal: true,
          viewport,
          cursorRows,
        });
        state.completion = {
          failedPackages: { ...layout.completion.failedPackages },
        };
        return layout.frame;
      },
    });
  }

  const stop = () => {
    if (state.stopped) return;
    state.stopped = true;
    state.runtime?.stop();
  };

  return {
    start() {
      if (state.started || state.stopped) return;
      state.started = true;
      state.write(
        formatIntroLine(
          `workspace ${state.task}`,
          `strategy: parallel, ${state.jobs} ${Str.plural(state.jobs, 'job')} (concurrent)`,
        ),
      );
      if (!state.terminal) return;
      state.write('');
      try {
        state.runtime?.start();
      } catch (error) {
        state.stopped = true;
        throw error;
      }
    },

    event(event) {
      if (state.stopped) return;
      state.progress.event(event);
      if (event.kind !== 'done') {
        state.runtime?.render();
        return;
      }
      runCleanup([() => state.runtime?.render(), stop]);
    },

    stop,
    completion: () => state.completion,
  };
}
