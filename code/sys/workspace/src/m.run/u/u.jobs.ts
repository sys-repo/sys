import { Err, Num, type t } from '../common.ts';

export type ResolveJobsArgs = {
  readonly jobs?: t.WorkspaceRun.Test.Strategy.Jobs;
  readonly hardwareConcurrency?: number;
};

/** Resolve the concrete parallel worker bound for one workspace test run. */
export function resolveJobs(args: ResolveJobsArgs = {}): number {
  const jobs = args.jobs;
  if (jobs === undefined || jobs === 'auto') return autoJobs(args.hardwareConcurrency);
  if (!Num.Is.safeInt(jobs) || jobs < 1) {
    throw Err.std(`Workspace.Run: parallel jobs must be a positive integer (${jobs})`);
  }
  return jobs;
}

/** Bounded default for package-level parallelism. */
export function autoJobs(hardwareConcurrency = navigator.hardwareConcurrency): number {
  if (!Num.Is.safeInt(hardwareConcurrency) || hardwareConcurrency < 1) return 4;
  const half = (hardwareConcurrency - (hardwareConcurrency % 2)) / 2;
  return Num.clamp(2, 8, half);
}
