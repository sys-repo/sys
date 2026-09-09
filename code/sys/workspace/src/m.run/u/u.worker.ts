import { Fs, Is, Num, Obj, Process, type t, Time } from '../common.ts';
import { type RunCandidate, runCandidateIdentity } from './u.plan.ts';
import type { NativeTestStatsRun, PreparedNativeTestStats } from '../u.testStats/mod.ts';

export type PackageCommand = {
  readonly cmd: string;
  readonly args: readonly string[];
};

export type PackageWorkerArgs = {
  cwd: t.StringDir;
  task: t.WorkspaceRun.Task;
  candidate: RunCandidate;
  command: PackageCommand;
  testStats?: NativeTestStatsRun;
};

export type PackageWorker = (
  args: PackageWorkerArgs,
) => Promise<t.WorkspaceRun.Package.Ran>;

export type PackageRunArgs = PackageWorkerArgs & {
  stdio: 'buffered' | 'inherit';
};

/** Resolve the command used for one package task, preserving dry-run fallback semantics. */
export function resolveCommand(
  deno: Record<string, unknown>,
  task: t.WorkspaceRun.Task,
): PackageCommand | null {
  if (hasTask(deno, task)) return { cmd: 'deno', args: ['task', task] };
  if (task === 'dry') return { cmd: 'deno', args: ['publish', '--allow-dirty', '--dry-run'] };
  return null;
}

/** Run one package task using either inherited or buffered child stdio. */
export async function runPackage(args: PackageRunArgs): Promise<t.WorkspaceRun.Package.Ran> {
  const packageStartedAt = Time.now.timestamp;
  const cwd = Fs.join(args.cwd, args.candidate.dir);
  const stats = args.task === 'test'
    ? args.testStats?.prepare({
      task: args.task,
      packagePath: args.candidate.dir,
      deno: args.candidate.deno,
      command: args.command,
    })
    : undefined;
  const packageCommand = stats?.command ?? args.command;
  const command = {
    cwd,
    cmd: packageCommand.cmd,
    args: [...packageCommand.args],
  };

  if (args.stdio === 'inherit') {
    const output = await Process.inherit(command);
    return await wrangle.withStats(stats, {
      ...runCandidateIdentity(args.candidate),
      kind: 'ran',
      code: output.code,
      success: output.success,
      signal: output.signal,
      elapsed: Time.now.timestamp - packageStartedAt,
    });
  }

  const output = await Process.invoke({ ...command, silent: true });
  return await wrangle.withStats(stats, {
    ...runCandidateIdentity(args.candidate),
    kind: 'ran',
    code: output.code,
    success: output.success,
    signal: output.signal,
    elapsed: Time.now.timestamp - packageStartedAt,
    stdout: output.text.stdout,
    stderr: output.text.stderr,
  });
}

/**
 * Helpers:
 */
const wrangle = {
  async withStats(
    stats: PreparedNativeTestStats | undefined,
    ran: t.WorkspaceRun.Package.Ran,
  ): Promise<t.WorkspaceRun.Package.Ran> {
    if (!stats) return ran;
    return { ...ran, testStats: await stats.collect() };
  },
} as const;

function hasTask(deno: Record<string, unknown>, task: t.WorkspaceRun.Task) {
  const tasks = deno.tasks;
  if (!Obj.isRecord(tasks)) return false;
  const value = tasks[task];
  return Is.str(value) && Num.clamp(0, 1, value.trim().length) === 1;
}
