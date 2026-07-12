import { Arr, Obj, Str, type t, Time } from '../common.ts';
import type { RunPlan } from '../u/u.plan.ts';
import { resolveCommand, runPackage } from '../u/u.worker.ts';
import type { NativeTestStatsRun } from '../u.testStats/mod.ts';

export type SequentialRunArgs = {
  readonly cwd: t.StringDir;
  readonly task: t.WorkspaceRun.Task;
  readonly plan: RunPlan;
  readonly startedAt: t.Msecs;
  readonly testStats?: NativeTestStatsRun;
};

/**
 * Run package tasks sequentially in graph order.
 *
 * Preserves the baseline runner semantics: inherited stdio, skipped missing tasks,
 * and fail-fast on the first non-zero package result.
 */
export async function runSequential(args: SequentialRunArgs): Promise<t.WorkspaceRun.Result> {
  const { cwd, task, plan, startedAt } = args;
  const packages: t.WorkspaceRun.Package.Result[] = [];

  for (const candidate of plan.candidates) {
    const command = resolveCommand(candidate.deno, task);
    if (!command) {
      packages.push({ kind: 'skipped', path: candidate.dir, reason: 'task:missing' });
      continue;
    }

    console.info(Str.dedent(`
      workspace ${task} → ${candidate.dir}
    `));

    const ran = await runPackage({
      cwd,
      task,
      candidate,
      command,
      stdio: 'inherit',
      testStats: args.testStats,
    });

    packages.push(Obj.clone(ran));
    if (!ran.success) {
      const elapsed = Time.now.timestamp - startedAt;
      return {
        ok: false,
        task,
        cwd,
        elapsed,
        orderedPaths: plan.orderedPaths,
        packages,
        failure: ran,
      };
    }
  }

  const elapsed = Time.now.timestamp - startedAt;

  return {
    ok: true,
    task,
    cwd,
    elapsed,
    orderedPaths: Arr.uniq([...plan.orderedPaths]),
    packages,
  };
}
