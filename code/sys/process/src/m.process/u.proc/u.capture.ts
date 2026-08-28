import { Is, Num, type t, Time } from '../common.ts';
import {
  asCommand,
  createFailureLedger,
  type FailureEvent,
  type FailureLedger,
  observeChildStatus,
  type OperationDeadline,
  operationDeadline,
  type OwnedChildStatusOperation,
  type OwnedChildStatusResult,
  settleOwnedStream,
  terminateOwnedChild,
} from '../u/u.ts';

const DEFAULT_KILL_GRACE_MS = 1_000 as t.Msecs;
const STATUS_SETTLE_TIMEOUT = 5_000 as t.Msecs;
const STREAM_SETTLE_TIMEOUT = 5_000 as t.Msecs;

type CapturedStream = {
  readonly data: Uint8Array;
  readonly truncated: boolean;
};

type CapturedStreams = {
  readonly stdout: CapturedStream;
  readonly stderr: CapturedStream;
};

type CaptureStreamOperation = {
  readonly source: t.Process.StdStream;
  readonly stream: ReadableStream<Uint8Array>;
  readonly reader: ReadableStreamDefaultReader<Uint8Array>;
  readonly promise: Promise<CapturedStream>;
  readonly failure: Promise<void>;
  readonly failed: boolean;
  snapshot(): CapturedStream;
};

type TerminalTrigger =
  | { readonly kind: 'status'; readonly result: OwnedChildStatusResult }
  | { readonly kind: 'stream' }
  | { readonly kind: 'timeout' }
  | { readonly kind: 'cancelled' };

type CancellablePromise<T> = {
  readonly promise: Promise<T>;
  cancel(): void;
};

type SpawnChild = (config: t.Process.CaptureArgs) => Deno.ChildProcess;

export type CaptureDependencies = {
  readonly cleanupTimeout?: t.Msecs;
  readonly statusSettleTimeout?: t.Msecs;
  readonly streamTimeout?: t.Msecs;
};

const spawnChild: SpawnChild = (config) =>
  asCommand(
    {
      args: config.args,
      cmd: config.cmd,
      cwd: config.cwd,
      clearEnv: config.clearEnv,
      env: config.env,
    },
    { stdin: 'null', stdout: 'piped', stderr: 'piped' },
  ).spawn();

/** Execute a no-shell argv command with bounded stdout/stderr capture. */
export const capture: t.Process.Lib['capture'] = (config) => captureWith(spawnChild, config);

/** Package-internal child seam for bounded capture failure proofs. */
export async function captureWith(
  spawn: SpawnChild,
  config: t.Process.CaptureArgs,
  deps: CaptureDependencies = {},
): Promise<t.Process.CaptureOutput> {
  const validated = validate(config);
  if (config.signal?.aborted) return cancelledOutput(null, [], emptyStreams());

  let child: Deno.ChildProcess;
  try {
    child = spawn(config);
  } catch (error) {
    return failedToStartOutput(error, emptyStreams());
  }

  const status = observeChildStatus(child.status);
  const failures = createFailureLedger<t.Process.CaptureFailurePhase>();
  let stdout: CaptureStreamOperation | undefined;
  let operations: {
    readonly stdout: CaptureStreamOperation;
    readonly stderr: CaptureStreamOperation;
  };
  try {
    stdout = readBounded('stdout', child.stdout, validated.maxStdoutBytes, failures);
    operations = {
      stdout,
      stderr: readBounded('stderr', child.stderr, validated.maxStderrBytes, failures),
    };
  } catch (error) {
    failures.record('setup', error);
    const deadline = captureDeadline(validated.killGraceMs, deps.cleanupTimeout);
    const termination = await terminateForCapture(
      child,
      status,
      failures,
      deadline,
      validated.killGraceMs,
      deps.statusSettleTimeout,
    );
    const terminalStatus = termination?.status ?? status.current;
    const drain = terminalStatus?.ok === true;
    const output = {
      stdout: stdout
        ? await settleCapturedStream(stdout, failures, deadline, deps.streamTimeout, drain)
        : emptyStream(),
      stderr: emptyStream(),
    };
    const records = failures.records();
    return failedOutput(
      statusOrNull(terminalStatus),
      termination?.actions ?? [],
      'failure',
      termination?.forceTimedOut ?? false,
      records,
      failures.toError(
        'Process.capture: child execution or cleanup failed.',
        'CaptureFailureError',
      ),
      output,
    );
  }
  const { stdout: stdoutOperation, stderr: stderrOperation } = operations;

  const statusTrigger = status.promise.then(
    (result): TerminalTrigger => ({ kind: 'status', result }),
  );
  const timeoutTrigger = validated.timeoutMs === undefined
    ? undefined
    : timeout(validated.timeoutMs, { kind: 'timeout' });
  const abortTrigger = config.signal ? abort(config.signal) : undefined;

  let trigger: TerminalTrigger;
  try {
    trigger = await Promise.race([
      statusTrigger,
      streamFailureTrigger(stdoutOperation),
      streamFailureTrigger(stderrOperation),
      ...(timeoutTrigger ? [timeoutTrigger.promise] : []),
      ...(abortTrigger ? [abortTrigger.promise] : []),
    ]);
  } finally {
    timeoutTrigger?.cancel();
    abortTrigger?.cancel();
  }

  if (trigger.kind === 'status' && !trigger.result.ok) {
    failures.record('status', trigger.result.error);
  }

  const deadline = captureDeadline(validated.killGraceMs, deps.cleanupTimeout);
  const termination = trigger.kind !== 'status' || !trigger.result.ok
    ? await terminateForCapture(
      child,
      status,
      failures,
      deadline,
      validated.killGraceMs,
      deps.statusSettleTimeout,
    )
    : undefined;

  const terminalStatus = termination?.status ?? status.current;
  const drain = terminalStatus?.ok === true;
  const captured = {
    stdout: await settleCapturedStream(
      stdoutOperation,
      failures,
      deadline,
      deps.streamTimeout,
      drain,
    ),
    stderr: await settleCapturedStream(
      stderrOperation,
      failures,
      deadline,
      deps.streamTimeout,
      drain,
    ),
  };

  if (failures.hasFailures) {
    const records = failures.records();
    return failedOutput(
      statusOrNull(terminalStatus),
      termination?.actions ?? [],
      failureReason(trigger),
      termination?.forceTimedOut ?? false,
      records,
      failures.toError(
        'Process.capture: child execution or cleanup failed.',
        'CaptureFailureError',
      ),
      captured,
    );
  }

  if (trigger.kind === 'status' && trigger.result.ok) {
    return exitedOutput(trigger.result.status, captured);
  }
  if (trigger.kind === 'timeout') {
    return timedOutOutput(
      statusOrNull(termination?.status),
      termination?.actions ?? [],
      captured,
    );
  }
  if (trigger.kind === 'cancelled') {
    return cancelledOutput(
      statusOrNull(termination?.status),
      termination?.actions ?? [],
      captured,
    );
  }

  throw new Error(`Process.capture: terminal failure was not preserved: ${trigger.kind}.`);
}

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
  if (
    !Is.num(input) ||
    !Num.Is.safeInt(input) ||
    input < 0 ||
    input > Time.Delay.MAX
  ) {
    throw new Error(`Process.capture: invalid ${label}: ${String(input)}.`);
  }
  return input;
}

function captureDeadline(killGraceMs: t.Msecs, input?: t.Msecs) {
  const cleanupTail = STATUS_SETTLE_TIMEOUT + STREAM_SETTLE_TIMEOUT * 2;
  const fallback = Num.clamp(0, Num.MAX_INT, killGraceMs + cleanupTail) as t.Msecs;
  const timeout = input === undefined ? fallback : msecs('cleanupTimeout', input);
  return operationDeadline(timeout);
}

function readBounded(
  source: t.Process.StdStream,
  stream: ReadableStream<Uint8Array>,
  maxBytes: number,
  failures: FailureLedger<t.Process.CaptureFailurePhase>,
): CaptureStreamOperation {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  const failure = Promise.withResolvers<void>();
  let total = 0;
  let truncated = false;
  let failed = false;

  const snapshot = (): CapturedStream => ({ data: concat(chunks, total), truncated });
  const report = (phase: t.Process.CaptureFailurePhase, error: unknown) => {
    failed = true;
    failures.record(phase, error);
    failure.resolve();
  };
  const promise = (async () => {
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
    } catch (error) {
      report(`${source}:read`, error);
    } finally {
      try {
        reader.releaseLock();
      } catch (error) {
        report(`${source}:release`, error);
      }
    }
    return snapshot();
  })();

  return {
    source,
    stream,
    reader,
    promise,
    failure: failure.promise,
    get failed() {
      return failed;
    },
    snapshot,
  };
}

function streamFailureTrigger(operation: CaptureStreamOperation): Promise<TerminalTrigger> {
  return operation.failure.then(() => ({ kind: 'stream' }));
}

async function settleCapturedStream(
  operation: CaptureStreamOperation,
  failures: FailureLedger<t.Process.CaptureFailurePhase>,
  deadline: OperationDeadline,
  timeoutMs: t.Msecs | undefined,
  drain: boolean,
): Promise<CapturedStream> {
  const { source, stream, reader } = operation;
  const settlement = await settleOwnedStream({
    stream,
    reader,
    operation: operation.promise,
    drain,
    deadline,
    timeout: timeoutMs ?? STREAM_SETTLE_TIMEOUT,
    observe: () => !operation.failed,
    report(phase, error) {
      failures.record(`${source}:${phase}`, error);
    },
    timeoutError(phase) {
      const action = phase === 'cancel' ? 'cancelling' : 'settling';
      return new Error(`Process.capture: timed out ${action} ${source}.`);
    },
  });
  return settlement.settled ? settlement.value : operation.snapshot();
}

async function terminateForCapture(
  child: Deno.ChildProcess,
  status: OwnedChildStatusOperation,
  failures: FailureLedger<t.Process.CaptureFailurePhase>,
  deadline: OperationDeadline,
  graceTimeout: t.Msecs,
  settleTimeout = STATUS_SETTLE_TIMEOUT,
) {
  const events: FailureEvent<t.Process.CaptureFailurePhase>[] = [];
  try {
    const result = await terminateOwnedChild(child, status, {
      deadline,
      graceTimeout,
      settleTimeout,
      onFailure(failure) {
        events.push(failures.record(failure.phase, failure.error));
      },
    });
    // Signal-attempt errors are provisional while owned status remains live. If status settles
    // anyway, discard only those exact events and preserve concurrent stream observations.
    if (result.status?.ok) failures.discard(events);
    return result;
  } catch (error) {
    failures.record('termination', error);
  }
}

function timeout(ms: t.Msecs, trigger: TerminalTrigger): CancellablePromise<TerminalTrigger> {
  const delay = Time.delay(ms);
  return { promise: delay.then(() => trigger), cancel: () => delay.cancel() };
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

function statusOrNull(result?: OwnedChildStatusResult) {
  return result?.ok ? result.status : null;
}

function failureReason(
  trigger: TerminalTrigger,
): t.Process.CaptureFailedOutput['termination']['reason'] {
  if (trigger.kind === 'timeout') return 'timeout';
  if (trigger.kind === 'cancelled') return 'cancelled';
  return 'failure';
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

function failedOutput(
  status: Deno.CommandStatus | null,
  actions: readonly t.Process.Terminate.Action[],
  reason: t.Process.CaptureFailedOutput['termination']['reason'],
  forceTimedOut: boolean,
  failures: readonly t.Process.CaptureFailure[],
  error: unknown,
  streams: CapturedStreams,
): t.Process.CaptureFailedOutput {
  return {
    ...baseOutput(streams, false),
    outcome: 'failed',
    status,
    code: status?.code ?? null,
    success: false,
    signal: status?.signal ?? null,
    termination: { reason, actions, forceTimedOut },
    failures,
    error,
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

function emptyStream(): CapturedStream {
  return { data: new Uint8Array(), truncated: false };
}

function emptyStreams(): CapturedStreams {
  return { stdout: emptyStream(), stderr: emptyStream() };
}
