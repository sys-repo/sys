import { Fs, Is, Num, Obj, Process, type t, Time } from '../common.ts';
import type { RunCandidate } from './u.plan.ts';

export type PackageCommand = {
  readonly cmd: string;
  readonly args: readonly string[];
};

export type PackageWorkerArgs = {
  readonly cwd: t.StringDir;
  readonly task: t.WorkspaceRun.Task;
  readonly candidate: RunCandidate;
  readonly command: PackageCommand;
};

export type PackageWorker = (
  args: PackageWorkerArgs,
) => Promise<t.WorkspaceRun.Package.Ran>;

export type PackageRunArgs = PackageWorkerArgs & {
  readonly stdio: 'buffered' | 'inherit';
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
  const command = {
    cwd,
    cmd: args.command.cmd,
    args: [...args.command.args],
  };

  if (args.stdio === 'inherit') {
    const output = await Process.inherit(command);
    return {
      kind: 'ran',
      path: args.candidate.dir,
      code: output.code,
      success: output.success,
      signal: output.signal,
      elapsed: Time.now.timestamp - packageStartedAt,
    };
  }

  const output = await Process.invoke({ ...command, silent: true });
  return {
    kind: 'ran',
    path: args.candidate.dir,
    code: output.code,
    success: output.success,
    signal: output.signal,
    elapsed: Time.now.timestamp - packageStartedAt,
    stdout: output.text.stdout,
    stderr: output.text.stderr,
  };
}

/** Helpers: */
function hasTask(deno: Record<string, unknown>, task: t.WorkspaceRun.Task) {
  const tasks = deno.tasks;
  if (!Obj.isRecord(tasks)) return false;
  const value = tasks[task];
  return Is.str(value) && Num.clamp(0, 1, value.trim().length) === 1;
}
