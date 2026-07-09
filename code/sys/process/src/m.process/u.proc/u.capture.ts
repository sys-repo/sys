import { Is, Num, type t } from '../common.ts';
import { asCommand } from '../u/u.ts';

const DEFAULT_KILL_GRACE_MS = 1_000 as t.Msecs;

type CapturedStream = {
  readonly data: Uint8Array;
  readonly truncated: boolean;
};

type CapturedStreams = {
  readonly stdout: CapturedStream;
  readonly stderr: CapturedStream;
};

type StatusResult =
  | { readonly ok: true; readonly status: Deno.CommandStatus }
  | { readonly ok: false; readonly error: unknown };

type TerminalTrigger =
  | { readonly kind: 'status'; readonly result: StatusResult }
  | { readonly kind: 'timeout' }
  | { readonly kind: 'cancelled' };

type CancellablePromise<T> = {
  readonly promise: Promise<T>;
  cancel(): void;
};

/** Execute a no-shell argv command with bounded stdout/stderr capture. */
export const capture: t.Process.Lib['capture'] = async (config) => {
  const validated = validate(config);
  if (config.signal?.aborted) return cancelledOutput(null, [], emptyStreams());

  let child: Deno.ChildProcess;
  try {
    child = asCommand(
      {
        args: config.args,
        cmd: config.cmd,
        cwd: config.cwd,
        env: config.env,
      },
      { stdin: 'null', stdout: 'piped', stderr: 'piped' },
    ).spawn();
  } catch (error) {
    return failedToStartOutput(error, emptyStreams());
  }

  const stdout = readBounded(child.stdout, validated.maxStdoutBytes);
  const stderr = readBounded(child.stderr, validated.maxStderrBytes);
  const streams = async () => ({ stdout: await stdout, stderr: await stderr });

  const status = child.status.then(
    (status): StatusResult => ({ ok: true, status }),
    (error): StatusResult => ({ ok: false, error }),
  );
  const statusTrigger = status.then((result): TerminalTrigger => ({ kind: 'status', result }));
  const timeoutTrigger = validated.timeoutMs === undefined
    ? undefined
    : timeout(validated.timeoutMs, { kind: 'timeout' });
  const abortTrigger = config.signal ? abort(config.signal) : undefined;

  let trigger: TerminalTrigger;
  try {
    trigger = await Promise.race([
      statusTrigger,
      ...(timeoutTrigger ? [timeoutTrigger.promise] : []),
      ...(abortTrigger ? [abortTrigger.promise] : []),
    ]);
  } finally {
    timeoutTrigger?.cancel();
    abortTrigger?.cancel();
  }

  if (trigger.kind === 'status') {
    const output = await streams();
    return trigger.result.ok
      ? exitedOutput(trigger.result.status, output)
      : failedToStartOutput(trigger.result.error, output);
  }

  const termination = await terminate(child, status, validated.killGraceMs);
  const output = await streams();
  return trigger.kind === 'timeout'
    ? timedOutOutput(statusOrNull(termination.status), termination.actions, output)
    : cancelledOutput(statusOrNull(termination.status), termination.actions, output);
};

/**
 * Helpers:
 */
function validate(input: t.Process.CaptureArgs) {
  if (!Is.array<string>(input.args) || !input.args.every(Is.str)) {
    throw new Error('Process.capture: args must be a string array.');
  }
  if (input.cmd !== undefined && (!Is.str(input.cmd) || input.cmd.trim().length === 0)) {
    throw new Error(`Process.capture: invalid cmd: ${String(input.cmd)}.`);
  }

  return {
    maxStdoutBytes: byteCap('maxStdoutBytes', input.maxStdoutBytes),
    maxStderrBytes: byteCap('maxStderrBytes', input.maxStderrBytes),
    timeoutMs: input.timeoutMs === undefined ? undefined : msecs('timeoutMs', input.timeoutMs),
    killGraceMs: input.killGraceMs === undefined
      ? DEFAULT_KILL_GRACE_MS
      : msecs('killGraceMs', input.killGraceMs),
  } as const;
}

function byteCap(label: string, input: number) {
  if (!Is.num(input) || !Num.Is.safeInt(input) || input < 0) {
    throw new Error(`Process.capture: invalid ${label}: ${String(input)}.`);
  }
  return input;
}

function msecs(label: string, input: t.Msecs) {
  if (!Is.num(input) || !Num.Is.safeInt(input) || input < 0) {
    throw new Error(`Process.capture: invalid ${label}: ${String(input)}.`);
  }
  return input;
}

async function readBounded(
  stream: ReadableStream<Uint8Array>,
  maxBytes: number,
): Promise<CapturedStream> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  let truncated = false;

  try {
    while (true) {
      const res = await reader.read();
      if (res.done) break;

      const chunk = res.value;
      if (total < maxBytes) {
        const remaining = maxBytes - total;
        if (chunk.length <= remaining) {
          chunks.push(chunk);
          total += chunk.length;
        } else {
          chunks.push(chunk.slice(0, remaining));
          total = maxBytes;
          truncated = true;
        }
      } else if (chunk.length > 0) {
        truncated = true;
      }
    }
  } catch {
    // Keep the already captured bytes. Termination can race stream closure.
  } finally {
    reader.releaseLock();
  }

  return { data: concat(chunks, total), truncated };
}

function concat(chunks: readonly Uint8Array[], total: number) {
  if (total === 0) return new Uint8Array();
  const output = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.length;
  }
  return output;
}

async function terminate(
  child: Deno.ChildProcess,
  status: Promise<StatusResult>,
  killGraceMs: t.Msecs,
) {
  const actions: t.Process.Terminate.Action[] = [signal(child, 'SIGTERM')];
  const grace = statusWithin(status, killGraceMs);
  const afterTerm = await grace.promise;
  grace.cancel();
  if (afterTerm) return { status: afterTerm, actions } as const;

  actions.push(signal(child, 'SIGKILL'));
  return { status: await status, actions } as const;
}

function statusWithin(
  status: Promise<StatusResult>,
  timeoutMs: t.Msecs,
): CancellablePromise<StatusResult | undefined> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const expired = new Promise<undefined>((resolve) => {
    timer = setTimeout(() => resolve(undefined), timeoutMs);
  });

  return {
    promise: Promise.race([status, expired]),
    cancel() {
      if (timer) clearTimeout(timer);
    },
  };
}

function timeout(ms: t.Msecs, trigger: TerminalTrigger): CancellablePromise<TerminalTrigger> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return {
    promise: new Promise<TerminalTrigger>((resolve) => {
      timer = setTimeout(() => resolve(trigger), ms);
    }),
    cancel() {
      if (timer) clearTimeout(timer);
    },
  };
}

function abort(signal: AbortSignal): CancellablePromise<TerminalTrigger> {
  let fired = false;
  let cleanup: (() => void) | undefined;

  return {
    promise: new Promise<TerminalTrigger>((resolve) => {
      const onAbort = () => {
        if (fired) return;
        fired = true;
        resolve({ kind: 'cancelled' });
      };
      cleanup = () => signal.removeEventListener('abort', onAbort);

      if (signal.aborted) onAbort();
      else signal.addEventListener('abort', onAbort, { once: true });
    }),
    cancel() {
      cleanup?.();
    },
  };
}

function signal(child: Deno.ChildProcess, signal: Deno.Signal): t.Process.Terminate.Action {
  try {
    child.kill(signal);
    return { signal, ok: true };
  } catch (error) {
    return { signal, ok: false, error };
  }
}

function statusOrNull(result: StatusResult) {
  return result.ok ? result.status : null;
}

function exitedOutput(
  status: Deno.CommandStatus,
  streams: CapturedStreams,
): t.Process.CaptureExitedOutput {
  return {
    ...baseOutput(streams, status.success),
    outcome: 'exited',
    status,
    code: status.code,
    success: status.success,
    signal: status.signal ?? null,
    termination: { reason: null, actions: [] },
  };
}

function timedOutOutput(
  status: Deno.CommandStatus | null,
  actions: readonly t.Process.Terminate.Action[],
  streams: CapturedStreams,
): t.Process.CaptureTimedOutOutput {
  return {
    ...baseOutput(streams, false),
    outcome: 'timed-out',
    status,
    code: status?.code ?? null,
    success: false,
    signal: status?.signal ?? null,
    termination: { reason: 'timeout', actions },
  };
}

function cancelledOutput(
  status: Deno.CommandStatus | null,
  actions: readonly t.Process.Terminate.Action[],
  streams: CapturedStreams,
): t.Process.CaptureCancelledOutput {
  return {
    ...baseOutput(streams, false),
    outcome: 'cancelled',
    status,
    code: status?.code ?? null,
    success: false,
    signal: status?.signal ?? null,
    termination: { reason: 'cancelled', actions },
  };
}

function failedToStartOutput(
  error: unknown,
  streams: CapturedStreams,
): t.Process.CaptureFailedToStartOutput {
  return {
    ...baseOutput(streams, false),
    outcome: 'failed-to-start',
    status: null,
    code: null,
    success: false,
    signal: null,
    termination: { reason: null, actions: [] },
    error,
  };
}

function baseOutput(streams: CapturedStreams, success: boolean): t.Process.CaptureBaseOutput {
  const { stdout, stderr } = streams;
  let stdoutText: string | undefined;
  let stderrText: string | undefined;
  const decoder = new TextDecoder();

  const output: t.Process.CaptureBaseOutput = {
    stdout: stdout.data,
    stderr: stderr.data,
    text: {
      get stdout() {
        return stdoutText ?? (stdoutText = decoder.decode(stdout.data));
      },
      get stderr() {
        return stderrText ?? (stderrText = decoder.decode(stderr.data));
      },
    },
    stdoutTruncated: stdout.truncated,
    stderrTruncated: stderr.truncated,
    toString() {
      return success ? output.text.stdout : output.text.stderr;
    },
  };
  return output;
}

function emptyStreams(): CapturedStreams {
  return {
    stdout: { data: new Uint8Array(), truncated: false },
    stderr: { data: new Uint8Array(), truncated: false },
  };
}
