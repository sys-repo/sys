import { DenoFile, Err, Is, Process, type t } from '../../-test.ts';

type CommandRun = {
  readonly kind: 'command';
  readonly cwd: string;
  readonly cmd: readonly string[];
  readonly ok: boolean;
  readonly code: number | null;
  readonly status: string;
  readonly stdout: string;
  readonly stderr: string;
};
type OperationRun = {
  readonly kind: 'operation';
  readonly cwd: string;
  readonly operation: string;
  readonly ok: boolean;
  readonly code: number;
  readonly status: string;
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
type CommandRunArgs = Omit<CommandRun, 'kind' | 'status'> & { readonly status?: string };
type OperationRunArgs = Omit<OperationRun, 'kind' | 'status'> & { readonly status?: string };
type CaptureDiagnostic = Pick<CommandRun, 'status' | 'stdout' | 'stderr'>;

export const FIXTURE_CAPTURE = {
  timeoutMs: 120_000,
  maxStdoutBytes: 2_000_000,
  maxStderrBytes: 2_000_000,
  killGraceMs: 1_000,
} as const;

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
  return {
    kind: 'command',
    ...args,
    status: args.status ?? `exit ${args.code ?? 'none'}`,
  };
}

export function operationRun(args: OperationRunArgs): TaskRun {
  return {
    kind: 'operation',
    ...args,
    status: args.status ?? `status ${args.code}`,
  };
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

  const invocation = run.kind === 'command'
    ? `cmd: ${run.cmd.join(' ')}`
    : `operation: ${run.operation}`;
  throw new Error(
    formatRunFailure({
      message,
      status: run.status,
      cwd: run.cwd,
      invocation,
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
  const output = await Process.capture({
    cmd,
    args: [...args],
    cwd,
    env,
    ...FIXTURE_CAPTURE,
  });

  return toCommandRun({ cwd, cmd: [cmd, ...args], output });
}

/** Convert one bounded process result into canonical external-fixture command evidence. */
export function toCommandRun(args: {
  readonly cwd: string;
  readonly cmd: readonly string[];
  readonly output: t.Process.CaptureOutput;
}): TaskRun {
  const { cwd, cmd, output } = args;
  const captured = captureDiagnostic(output);
  return commandRun({
    cwd,
    cmd,
    ok: output.outcome === 'exited' && output.success,
    code: output.code,
    ...captured,
  });
}

export function runDeno(cwd: string, args: readonly string[]): Promise<TaskRun> {
  return runCommand(cwd, 'deno', args);
}

export function formatCapturedText(args: {
  readonly stream: t.Process.StdStream;
  readonly text: string;
  readonly truncated: boolean;
  readonly maxBytes: number;
}) {
  const { stream, text, truncated, maxBytes } = args;
  if (!truncated) return text;

  const separator = text.length > 0 && !text.endsWith('\n') ? '\n' : '';
  return `${text}${separator}[${stream} truncated: output beyond ${maxBytes} bytes omitted]`;
}

/** Normalize bounded process evidence for every external-fixture diagnostic path. */
export function captureDiagnostic(output: t.Process.CaptureOutput): CaptureDiagnostic {
  return {
    status: captureStatus(output),
    stdout: capturedStreamText(output, 'stdout'),
    stderr: capturedStderr(output),
  };
}

function captureStatus(output: t.Process.CaptureOutput): string {
  switch (output.outcome) {
    case 'exited':
      return `exit ${output.code}`;
    case 'timed-out':
      return `timed out after ${FIXTURE_CAPTURE.timeoutMs}ms`;
    case 'cancelled':
      return 'cancelled';
    case 'failed-to-start':
      return 'failed to start';
  }
}

function capturedStreamText(
  output: t.Process.CaptureOutput,
  stream: t.Process.StdStream,
): string {
  const stdout = stream === 'stdout';
  return formatCapturedText({
    stream,
    text: stdout ? output.text.stdout : output.text.stderr,
    truncated: stdout ? output.stdoutTruncated : output.stderrTruncated,
    maxBytes: stdout ? FIXTURE_CAPTURE.maxStdoutBytes : FIXTURE_CAPTURE.maxStderrBytes,
  });
}

function capturedStderr(output: t.Process.CaptureOutput): string {
  const stderr = capturedStreamText(output, 'stderr');
  if (output.outcome !== 'failed-to-start') return stderr;

  const detail = `process error: ${Err.summary(output.error, { stack: true })}`;
  if (!stderr) return detail;
  return `${stderr}${stderr.endsWith('\n') ? '' : '\n'}${detail}`;
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
    Object.entries(env).filter((entry): entry is [string, string] => Is.string(entry[1])),
  );
}
