import { Arr, Fs, Is, Num, Obj, Process, Str, type t, Time } from './common.ts';

export type SequentialCandidate = {
  readonly dir: t.StringDir;
  readonly pkg: t.Pkg;
  readonly deno: Record<string, unknown>;
};

export type SequentialRunArgs = {
  readonly cwd: t.StringDir;
  readonly task: t.WorkspaceRun.Task;
  readonly candidates: readonly SequentialCandidate[];
  readonly orderedPaths: readonly t.StringPath[];
  readonly startedAt: t.Msecs;
};

type Command = {
  readonly cmd: string;
  readonly args: readonly string[];
};

/**
 * Run package tasks sequentially in graph order.
 *
 * Preserves the baseline runner semantics: inherited stdio, skipped missing tasks,
 * and fail-fast on the first non-zero package result.
 */
export async function runSequential(args: SequentialRunArgs): Promise<t.WorkspaceRun.Result> {
  const { cwd, task, candidates, orderedPaths, startedAt } = args;
  const packages: t.WorkspaceRun.Package.Result[] = [];

  for (const candidate of candidates) {
    const command = wrangle.command(candidate.deno, task);
    if (!command) {
      packages.push({ kind: 'skipped', path: candidate.dir, reason: 'task:missing' });
      continue;
    }

    console.info(Str.dedent(`
      workspace ${task} → ${candidate.dir}
    `));

    const packageStartedAt = Time.now.timestamp;
    const output = await Process.inherit({
      cwd: Fs.join(cwd, candidate.dir),
      cmd: command.cmd,
      args: [...command.args],
    });
    const ran: t.WorkspaceRun.Package.Ran = {
      kind: 'ran',
      path: candidate.dir,
      code: output.code,
      success: output.success,
      signal: output.signal,
      elapsed: Time.now.timestamp - packageStartedAt,
    };

    packages.push(Obj.clone(ran));
    if (!output.success) {
      const elapsed = Time.now.timestamp - startedAt;
      return {
        ok: false,
        task,
        cwd,
        elapsed,
        orderedPaths,
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
    orderedPaths: Arr.uniq([...orderedPaths]),
    packages,
  };
}

/**
 * Helpers:
 */
function hasTask(deno: Record<string, unknown>, task: t.WorkspaceRun.Task) {
  const tasks = deno.tasks;
  if (!Obj.isRecord(tasks)) return false;
  const value = tasks[task];
  return Is.str(value) && Num.clamp(0, 1, value.trim().length) === 1;
}

const wrangle = {
  command(deno: Record<string, unknown>, task: t.WorkspaceRun.Task): Command | null {
    if (hasTask(deno, task)) return { cmd: 'deno', args: ['task', task] };
    if (task === 'dry') return { cmd: 'deno', args: ['publish', '--allow-dirty', '--dry-run'] };
    return null;
  },
} as const;
