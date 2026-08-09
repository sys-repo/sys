import { DenoFile, Process, type t } from '../../-test.ts';

type CommandRun = {
  readonly kind: 'command';
  readonly cwd: string;
  readonly cmd: readonly string[];
  readonly ok: boolean;
  readonly code: number;
  readonly stdout: string;
  readonly stderr: string;
};
type OperationRun = {
  readonly kind: 'operation';
  readonly cwd: string;
  readonly operation: string;
  readonly ok: boolean;
  readonly code: number;
  readonly stdout: string;
  readonly stderr: string;
};

/** A completed external command or named in-process fixture operation. */
export type TaskRun = CommandRun | OperationRun;

type FailureArgs = {
  readonly message: string;
  readonly status: string;
  readonly cwd: string;
  readonly invocation: string;
  readonly stdout: string;
  readonly stderr: string;
};
type CommandRunArgs = Omit<CommandRun, 'kind'>;
type OperationRunArgs = Omit<OperationRun, 'kind'>;

/** Format one bounded diagnostic record without changing failure ownership. */
export function formatRunFailure(args: FailureArgs) {
  const { message, status, cwd, invocation, stdout, stderr } = args;
  return (
    `${message} (${status})\n` +
    `cwd: ${cwd}\n` +
    `${invocation}\n\n` +
    `stdout:\n${stdout || '(empty)'}\n\nstderr:\n${stderr || '(empty)'}`
  );
}

export function commandRun(args: CommandRunArgs): TaskRun {
  return { kind: 'command', ...args };
}

export function operationRun(args: OperationRunArgs): TaskRun {
  return { kind: 'operation', ...args };
}

export async function runTask(
  cwd: string,
  task: string,
  extraArgs: readonly string[] = [],
): Promise<TaskRun> {
  return runDeno(cwd, ['task', task, ...extraArgs]);
}

/** Preserve failed external-fixture command or operation context. */
export function assertRunOk(run: TaskRun, message: string) {
  if (run.ok) return;

  const detail = run.kind === 'command'
    ? { status: `exit ${run.code}`, invocation: `cmd: ${run.cmd.join(' ')}` }
    : { status: `status ${run.code}`, invocation: `operation: ${run.operation}` };
  throw new Error(
    formatRunFailure({
      message,
      status: detail.status,
      cwd: run.cwd,
      invocation: detail.invocation,
      stdout: run.stdout,
      stderr: run.stderr,
    }),
  );
}

export async function runCommand(
  cwd: string,
  cmd: string,
  args: readonly string[],
): Promise<TaskRun> {
  const env = minimalTaskEnv();
  const output = await Process.invoke({
    cmd,
    args: [...args],
    cwd,
    env,
    silent: true,
  });

  return commandRun({
    cwd,
    cmd: [cmd, ...args],
    ok: output.success,
    code: output.code,
    stdout: output.text.stdout,
    stderr: output.text.stderr,
  });
}

export async function runDeno(cwd: string, args: readonly string[]): Promise<TaskRun> {
  const env = minimalTaskEnv();
  const output = await Process.invoke({
    cmd: 'deno',
    args: [...args],
    cwd,
    env,
    silent: true,
  });

  return commandRun({
    cwd,
    cmd: ['deno', ...args],
    ok: output.success,
    code: output.code,
    stdout: output.text.stdout,
    stderr: output.text.stderr,
  });
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
