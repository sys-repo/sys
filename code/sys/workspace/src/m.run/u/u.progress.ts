import { Num, type t, Time } from '../common.ts';
import type { ParallelRunEvent } from '../u.run/mod.ts';

export type ParallelProgressModel = {
  /** Apply one scheduler event and return the current progress snapshot. */
  readonly event: (event: ParallelRunEvent) => ParallelProgressSnapshot;
  /** Return the current progress snapshot. */
  readonly snapshot: () => ParallelProgressSnapshot;
};

export type ParallelProgressModelArgs = {
  runnablePaths: readonly t.StringPath[];
  now?: () => t.Msecs;
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
  /** Original failed package results retained in workspace graph order. */
  readonly failedPackages: readonly t.WorkspaceRun.Package.Ran[];
  readonly elapsed: t.Msecs;
};

export type ParallelProgressRunning = {
  readonly name?: t.StringPkgName;
  readonly path: t.StringPath;
  readonly elapsed: t.Msecs;
};

export type ParallelProgressCompleted = {
  readonly name?: t.StringPkgName;
  readonly path: t.StringPath;
  readonly kind: 'passed' | 'failed' | 'skipped' | 'blocked';
  readonly elapsed?: t.Msecs;
  readonly testStats?: t.WorkspaceRun.Test.Stats.Result;
};

type Running = t.WorkspaceRun.Package.Identity & {
  readonly startedAt: t.Msecs;
};

type ProgressState = {
  readonly runnablePaths: Set<t.StringPath>;
  readonly runnableOrder: Map<t.StringPath, number>;
  readonly runnableTotal: number;
  readonly startedAt: t.Msecs;
  readonly now: () => t.Msecs;
  readonly running: Map<t.StringPath, Running>;
  completed: ParallelProgressCompleted[];
  failedPackages: t.WorkspaceRun.Package.Ran[];
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
  const runnableOrder = new Map(args.runnablePaths.map((path, index) => [path, index]));
  const now = args.now ?? (() => Time.now.timestamp);
  const state: ProgressState = {
    runnablePaths,
    runnableOrder,
    runnableTotal: runnablePaths.size,
    startedAt: now(),
    now,
    running: new Map(),
    completed: [],
    failedPackages: [],
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

/**
 * Helpers:
 */
const wrangle = {
  event(state: ProgressState, event: ParallelRunEvent) {
    switch (event.kind) {
      case 'start': {
        if (wrangle.isRunnable(state, event.path)) state.pending = wrangle.decrement(state.pending);
        state.running.set(event.path, {
          ...wrangle.projectIdentity(event),
          startedAt: state.now(),
        });
        return;
      }

      case 'skip': {
        state.skipped += 1;
        wrangle.addCompleted(state, {
          ...wrangle.projectIdentity(event.result),
          kind: 'skipped',
        });
        return;
      }

      case 'finish': {
        const { result } = event;
        state.running.delete(result.path);
        if (result.success) {
          state.passed += 1;
        } else {
          state.failed += 1;
          state.failedPackages = wrangle.sortFailedPackages(state, [
            ...state.failedPackages,
            result,
          ]);
        }
        wrangle.addCompleted(state, {
          ...wrangle.projectIdentity(result),
          kind: result.success ? 'passed' : 'failed',
          elapsed: result.elapsed,
          ...(result.testStats ? { testStats: result.testStats } : {}),
        });
        return;
      }

      case 'block': {
        const { result } = event;
        state.blocked += 1;
        if (wrangle.isRunnable(state, result.path)) {
          state.pending = wrangle.decrement(state.pending);
          state.blockedRunnable += 1;
        }
        wrangle.addCompleted(state, {
          ...wrangle.projectIdentity(result),
          kind: 'blocked',
        });
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
      running.push({
        name: item.name,
        path: item.path,
        elapsed: now - item.startedAt,
      });
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
      failedPackages: [...state.failedPackages],
      elapsed: now - state.startedAt,
    };
  },

  sortFailedPackages(
    state: ProgressState,
    packages: readonly t.WorkspaceRun.Package.Ran[],
  ) {
    return [...packages].sort((a, b) => {
      const aIndex = state.runnableOrder.get(a.path) ?? Num.MAX_INT;
      const bIndex = state.runnableOrder.get(b.path) ?? Num.MAX_INT;
      return aIndex - bIndex;
    });
  },

  projectIdentity(item: t.WorkspaceRun.Package.Identity): t.WorkspaceRun.Package.Identity {
    return { name: item.name, path: item.path };
  },

  isRunnable(state: ProgressState, path: t.StringPath) {
    return state.runnablePaths.has(path);
  },

  addCompleted(state: ProgressState, item: ParallelProgressCompleted) {
    state.completed = [item, ...state.completed];
  },

  decrement(value: number) {
    return value > 0 ? value - 1 : 0;
  },
} as const;
