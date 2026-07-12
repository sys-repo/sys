import { type t, Time } from '../common.ts';
import type { ParallelRunEvent } from './u.run.parallel.ts';

export type ParallelProgressModel = {
  /** Apply one scheduler event and return the current progress snapshot. */
  readonly event: (event: ParallelRunEvent) => ParallelProgressSnapshot;
  /** Return the current progress snapshot. */
  readonly snapshot: () => ParallelProgressSnapshot;
};

export type ParallelProgressModelArgs = {
  readonly runnablePaths: readonly t.StringPath[];
  readonly now?: () => t.Msecs;
};

export type ParallelProgressSnapshot = {
  readonly runnableTotal: number;
  readonly passed: number;
  readonly skipped: number;
  readonly blocked: number;
  readonly blockedRunnable: number;
  readonly failed: number;
  readonly pending: number;
  readonly running: readonly ParallelProgressRunning[];
  readonly completed: readonly ParallelProgressCompleted[];
  readonly elapsed: t.Msecs;
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

type ProgressState = {
  readonly runnablePaths: Set<t.StringPath>;
  readonly runnableTotal: number;
  readonly startedAt: t.Msecs;
  readonly now: () => t.Msecs;
  readonly running: Map<t.StringPath, Running>;
  completed: ParallelProgressCompleted[];
  pending: number;
  passed: number;
  skipped: number;
  blocked: number;
  blockedRunnable: number;
  failed: number;
};

/** Create a package-level progress model from workspace scheduler events. */
export function createParallelProgressModel(
  args: ParallelProgressModelArgs,
): ParallelProgressModel {
  const runnablePaths = new Set(args.runnablePaths);
  const now = args.now ?? (() => Time.now.timestamp);
  const state: ProgressState = {
    runnablePaths,
    runnableTotal: runnablePaths.size,
    startedAt: now(),
    now,
    running: new Map(),
    completed: [],
    pending: runnablePaths.size,
    passed: 0,
    skipped: 0,
    blocked: 0,
    blockedRunnable: 0,
    failed: 0,
  };

  return {
    event(event) {
      wrangle.event(state, event);
      return wrangle.snapshot(state);
    },
    snapshot: () => wrangle.snapshot(state),
  };
}

/** Helpers: */
const wrangle = {
  event(state: ProgressState, event: ParallelRunEvent) {
    switch (event.kind) {
      case 'start': {
        if (wrangle.isRunnable(state, event.path)) state.pending = wrangle.decrement(state.pending);
        state.running.set(event.path, { path: event.path, startedAt: state.now() });
        return;
      }

      case 'skip': {
        state.skipped += 1;
        wrangle.addCompleted(state, { kind: 'skipped', path: event.path });
        return;
      }

      case 'finish': {
        state.running.delete(event.path);
        if (event.result.success) state.passed += 1;
        else state.failed += 1;
        wrangle.addCompleted(state, {
          kind: event.result.success ? 'passed' : 'failed',
          path: event.path,
          elapsed: event.result.elapsed,
        });
        return;
      }

      case 'block': {
        state.blocked += 1;
        if (wrangle.isRunnable(state, event.path)) {
          state.pending = wrangle.decrement(state.pending);
          state.blockedRunnable += 1;
        }
        wrangle.addCompleted(state, { kind: 'blocked', path: event.path });
        return;
      }

      case 'done':
        return;
    }
  },

  snapshot(state: ProgressState): ParallelProgressSnapshot {
    const now = state.now();
    const running: ParallelProgressRunning[] = [];
    for (const item of state.running.values()) {
      running.push({ path: item.path, elapsed: now - item.startedAt });
    }

    return {
      runnableTotal: state.runnableTotal,
      passed: state.passed,
      skipped: state.skipped,
      blocked: state.blocked,
      blockedRunnable: state.blockedRunnable,
      failed: state.failed,
      pending: state.pending,
      running,
      completed: [...state.completed],
      elapsed: now - state.startedAt,
    };
  },

  isRunnable(state: ProgressState, path: t.StringPath) {
    return state.runnablePaths.has(path);
  },

  addCompleted(state: ProgressState, item: ParallelProgressCompleted) {
    state.completed = [item, ...state.completed].slice(0, 64);
  },

  decrement(value: number) {
    return value > 0 ? value - 1 : 0;
  },
} as const;
