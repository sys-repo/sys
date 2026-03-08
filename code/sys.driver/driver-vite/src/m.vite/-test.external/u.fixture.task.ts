import { DenoFile, Process, type t } from '../../-test.ts';

export type TaskRun = {
  readonly cwd: string;
  readonly cmd: readonly string[];
  readonly ok: boolean;
  readonly code: number;
  readonly stdout: string;
  readonly stderr: string;
};

export async function runTask(cwd: string, task: string, extraArgs: readonly string[] = []): Promise<TaskRun> {
  const cmd = ['task', task, ...extraArgs] as const;
  return runDeno(cwd, cmd);
}

export async function runDeno(cwd: string, cmd: readonly string[]): Promise<TaskRun> {
  const env = minimalTaskEnv();
  const output = await Process.invoke({
    cmd: 'deno',
    args: [...cmd],
    cwd,
    env,
    silent: true,
  });

  return {
    cwd,
    cmd,
    ok: output.success,
    code: output.code,
    stdout: output.text.stdout,
    stderr: output.text.stderr,
  };
}

export async function workspaceRoot() {
  return (await DenoFile.workspace()).dir;
}

function minimalTaskEnv(): Record<string, string> {
  const env = {
    HOME: Deno.env.get('HOME'),
    PATH: Deno.env.get('PATH'),
    TMPDIR: Deno.env.get('TMPDIR'),
    TMP: Deno.env.get('TMP'),
    TEMP: Deno.env.get('TEMP'),
  };

  return Object.fromEntries(
    Object.entries(env).filter((entry): entry is [string, string] => typeof entry[1] === 'string'),
  );
}
