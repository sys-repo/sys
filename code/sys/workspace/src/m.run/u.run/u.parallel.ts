import { Arr, Err, Num, Obj, type t, Time } from '../common.ts';
import type { RunCandidate, RunPlan } from '../u/u.plan.ts';
import {
  type PackageCommand,
  type PackageWorker,
  resolveCommand,
  runPackage,
} from '../u/u.worker.ts';
import type { NativeTestStatsRun } from '../u.testStats/mod.ts';

export type ParallelRunArgs = {
  readonly cwd: t.StringDir;
  readonly task: t.WorkspaceRun.Task;
  readonly plan: RunPlan;
  readonly jobs: number;
  readonly startedAt: t.Msecs;
  readonly worker?: PackageWorker;
  readonly onEvent?: ParallelRunEventHandler;
  readonly testStats?: NativeTestStatsRun;
};

export type ParallelRunEventHandler = (event: ParallelRunEvent) => void;

export type ParallelRunEvent =
  | { readonly kind: 'start'; readonly path: t.StringPath }
  | {
    readonly kind: 'skip';
    readonly path: t.StringPath;
    readonly result: t.WorkspaceRun.Package.Skipped;
  }
  | {
    readonly kind: 'finish';
    readonly path: t.StringPath;
    readonly result: t.WorkspaceRun.Package.Ran;
  }
  | {
    readonly kind: 'block';
    readonly path: t.StringPath;
    readonly result: t.WorkspaceRun.Package.Blocked;
  }
  | { readonly kind: 'done'; readonly result: t.WorkspaceRun.Result };

type WorkerDone = {
  readonly path: t.StringPath;
  readonly result: t.WorkspaceRun.Package.Ran;
};

type SchedulerState = {
  readonly orderedPaths: readonly t.StringPath[];
  readonly candidateByPath: Map<t.StringPath, RunCandidate>;
  readonly dependencies: Map<t.StringPath, Set<t.StringPath>>;
  readonly dependents: Map<t.StringPath, t.StringPath[]>;
  readonly commands: Map<t.StringPath, PackageCommand | null>;
  readonly pending: Set<t.StringPath>;
  readonly ready: Set<t.StringPath>;
  readonly running: Map<t.StringPath, Promise<WorkerDone>>;
  readonly terminal: Map<t.StringPath, t.WorkspaceRun.Package.Result>;
  failed: boolean;
};

/** Run package tasks concurrently across a topology-safe package frontier. */
export async function runParallel(args: ParallelRunArgs): Promise<t.WorkspaceRun.Result> {
  if (!Num.Is.safeInt(args.jobs) || args.jobs < 1) {
    throw Err.std(`Workspace.Run.parallel: jobs must be a positive integer (${args.jobs})`);
  }

  const worker = args.worker ?? wrangle.bufferedWorker;
  const state = wrangle.state(args.plan);

  while (state.terminal.size < state.orderedPaths.length) {
    wrangle.drainSkips(args, state);
    if (!state.failed) wrangle.launch(args, state, worker);

    if (state.running.size === 0) {
      wrangle.drainSkips(args, state);
      if (state.terminal.size >= state.orderedPaths.length) break;
      if (state.failed) {
        wrangle.blockRemaining(args, state);
        break;
      }
      throw Err.std('Workspace.Run.parallel: no runnable packages remain');
    }

    const completed = await Promise.race([...state.running.values()]);
    wrangle.finish(args, state, completed);
  }

  const result = wrangle.result(args, state);
  args.onEvent?.({ kind: 'done', result });
  return result;
}

/**
 * Helpers:
 */
const wrangle = {
  bufferedWorker(args: Parameters<PackageWorker>[0]) {
    return runPackage({ ...args, stdio: 'buffered' });
  },

  state(plan: RunPlan): SchedulerState {
    const orderedPaths = Arr.uniq([...plan.orderedPaths]);
    const candidateByPath = new Map<t.StringPath, RunCandidate>();
    const dependencies = new Map<t.StringPath, Set<t.StringPath>>();
    const dependents = new Map<t.StringPath, t.StringPath[]>();

    for (const candidate of plan.candidates) {
      candidateByPath.set(candidate.dir, candidate);
    }
    for (const path of orderedPaths) {
      if (!candidateByPath.has(path)) {
        throw Err.std(`Workspace.Run.parallel: missing candidate for package: ${path}`);
      }
      dependencies.set(path, new Set());
      dependents.set(path, []);
    }

    const selected = new Set(orderedPaths);
    for (const edge of plan.edges) {
      if (!selected.has(edge.from) || !selected.has(edge.to)) continue;
      wrangle.getSet(dependencies, edge.to).add(edge.from);
      wrangle.getList(dependents, edge.from).push(edge.to);
    }

    const ready = new Set<t.StringPath>();
    for (const path of orderedPaths) {
      if (wrangle.getSet(dependencies, path).size === 0) ready.add(path);
    }

    return {
      orderedPaths,
      candidateByPath,
      dependencies,
      dependents,
      commands: new Map(),
      pending: new Set(orderedPaths),
      ready,
      running: new Map(),
      terminal: new Map(),
      failed: false,
    };
  },

  command(state: SchedulerState, path: t.StringPath, task: t.WorkspaceRun.Task) {
    if (!state.commands.has(path)) {
      const candidate = wrangle.candidate(state, path);
      state.commands.set(path, resolveCommand(candidate.deno, task));
    }
    return state.commands.get(path) ?? null;
  },

  drainSkips(args: ParallelRunArgs, state: SchedulerState) {
    let changed = true;
    while (changed) {
      changed = false;
      for (const path of state.orderedPaths) {
        if (!state.ready.has(path)) continue;
        if (wrangle.command(state, path, args.task)) continue;

        const result: t.WorkspaceRun.Package.Skipped = {
          kind: 'skipped',
          path,
          reason: 'task:missing',
        };
        wrangle.markTerminal(state, path, result);
        args.onEvent?.({ kind: 'skip', path, result });
        wrangle.unlock(state, path);
        changed = true;
      }
    }
  },

  launch(args: ParallelRunArgs, state: SchedulerState, worker: PackageWorker) {
    while (!state.failed && state.running.size < args.jobs) {
      wrangle.drainSkips(args, state);
      const path = wrangle.nextRunnable(state, args.task);
      if (!path) return;

      const candidate = wrangle.candidate(state, path);
      const command = wrangle.command(state, path, args.task);
      if (!command) continue;

      state.ready.delete(path);
      state.pending.delete(path);
      args.onEvent?.({ kind: 'start', path });
      state.running.set(
        path,
        worker({
          cwd: args.cwd,
          task: args.task,
          candidate,
          command,
          testStats: args.testStats,
        }).then((result) => ({
          path,
          result: result.path === path ? result : { ...result, path },
        })),
      );
    }
  },

  nextRunnable(state: SchedulerState, task: t.WorkspaceRun.Task) {
    for (const path of state.orderedPaths) {
      if (!state.ready.has(path)) continue;
      if (wrangle.command(state, path, task)) return path;
    }
    return undefined;
  },

  finish(args: ParallelRunArgs, state: SchedulerState, done: WorkerDone) {
    state.running.delete(done.path);
    const result = Obj.clone(done.result);
    wrangle.markTerminal(state, done.path, result);
    args.onEvent?.({ kind: 'finish', path: done.path, result });

    if (result.success) {
      wrangle.unlock(state, done.path);
    } else {
      state.failed = true;
    }
  },

  unlock(state: SchedulerState, path: t.StringPath) {
    for (const dependent of wrangle.getList(state.dependents, path)) {
      const remaining = wrangle.getSet(state.dependencies, dependent);
      remaining.delete(path);
      if (
        remaining.size === 0 &&
        state.pending.has(dependent) &&
        !state.running.has(dependent) &&
        !state.terminal.has(dependent)
      ) {
        state.ready.add(dependent);
      }
    }
  },

  blockRemaining(args: ParallelRunArgs, state: SchedulerState) {
    for (const path of state.orderedPaths) {
      if (state.terminal.has(path) || state.running.has(path)) continue;
      const reason = wrangle.getSet(state.dependencies, path).size > 0
        ? 'dependency:failed'
        : 'fail-fast';
      const result: t.WorkspaceRun.Package.Blocked = { kind: 'blocked', path, reason };
      wrangle.markTerminal(state, path, result);
      args.onEvent?.({ kind: 'block', path, result });
    }
  },

  markTerminal(
    state: SchedulerState,
    path: t.StringPath,
    result: t.WorkspaceRun.Package.Result,
  ) {
    state.ready.delete(path);
    state.pending.delete(path);
    state.terminal.set(path, Obj.clone(result));
  },

  result(args: ParallelRunArgs, state: SchedulerState): t.WorkspaceRun.Result {
    const elapsed = Time.now.timestamp - args.startedAt;
    const packages = state.orderedPaths.map((path) => {
      const result = state.terminal.get(path);
      if (!result) throw Err.std(`Workspace.Run.parallel: missing result for package: ${path}`);
      return Obj.clone(result);
    });
    const failure = packages.find((item): item is t.WorkspaceRun.Package.Ran => {
      return item.kind === 'ran' && !item.success;
    });

    if (failure) {
      return {
        ok: false,
        task: args.task,
        cwd: args.cwd,
        elapsed,
        orderedPaths: Arr.uniq([...state.orderedPaths]),
        packages,
        failure,
      };
    }

    return {
      ok: true,
      task: args.task,
      cwd: args.cwd,
      elapsed,
      orderedPaths: Arr.uniq([...state.orderedPaths]),
      packages,
    };
  },

  candidate(state: SchedulerState, path: t.StringPath) {
    const candidate = state.candidateByPath.get(path);
    if (!candidate) throw Err.std(`Workspace.Run.parallel: unknown package: ${path}`);
    return candidate;
  },

  getSet(map: Map<t.StringPath, Set<t.StringPath>>, path: t.StringPath) {
    const value = map.get(path);
    if (!value) {
      throw Err.std(`Workspace.Run.parallel: missing dependency set for package: ${path}`);
    }
    return value;
  },

  getList(map: Map<t.StringPath, t.StringPath[]>, path: t.StringPath) {
    const value = map.get(path);
    if (!value) {
      throw Err.std(`Workspace.Run.parallel: missing dependent list for package: ${path}`);
    }
    return value;
  },
} as const;
