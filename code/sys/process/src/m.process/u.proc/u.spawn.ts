import { c, Err, Is, Rx, type t } from '../common.ts';
import {
  asCommand,
  captureOperation,
  createFailureLedger,
  type FailureEvent,
  type FailureLedger,
  observeChildStatus,
  type OperationDeadline,
  operationDeadline,
  type OperationResult,
  type OwnedChildStatusOperation,
  type OwnedChildTerminationFailure,
  settleOwnedStream,
  terminateOwnedChild,
} from '../u/u.ts';

type H = t.Process.Handle;
type E = { source: t.Process.StdStream; fn: t.Process.EventHandler };
type ReadyWaiter = {
  readonly fn?: t.Process.ReadyHandler;
  resolve(handle: H): void;
  reject(cause: Error): void;
};
type Readiness =
  | { readonly kind: 'pending' }
  | { readonly kind: 'ready'; readonly args: t.Process.ReadyHandlerArgs }
  | { readonly kind: 'failed'; readonly error: Error };
type ByteStream = ReadableStream<Uint8Array>;
type StreamReader = ReadableStreamDefaultReader<Uint8Array>;
type StreamPump = Promise<OperationResult<void>>;
type OwnedStream = { stream: ByteStream; reader: StreamReader; pump?: StreamPump };
type OwnedState = {
  child?: Deno.ChildProcess;
  status?: OwnedChildStatusOperation;
  stdout?: OwnedStream;
  stderr?: OwnedStream;
};
type StreamSetup =
  | { readonly ok: true; readonly stdout: OwnedStream; readonly stderr: OwnedStream }
  | { readonly ok: false; readonly error: Error };
export type SpawnFailurePhase =
  | 'setup'
  | 'status'
  | 'termination'
  | 'readiness'
  | OwnedChildTerminationFailure['phase']
  | `${t.Process.StdStream}:${'read' | 'handler' | 'pump' | 'cancel' | 'release' | 'settle'}`;

export type SpawnDependencies = {
  readonly spawnChild: (config: t.Process.SpawnArgs) => Deno.ChildProcess;
  readonly cleanupTimeout?: t.Msecs;
  readonly streamTimeout?: t.Msecs;
  readonly terminationGraceTimeout?: t.Msecs;
  readonly terminationSettleTimeout?: t.Msecs;
};

const CLEANUP_TIMEOUT = 8_000 as t.Msecs;
const STREAM_SETTLE_TIMEOUT = 5_000 as t.Msecs;
const DEFAULT_DEPS: SpawnDependencies = {
  spawnChild: (config) => asCommand(config, { stdin: 'null' }).spawn(),
};

/** Spawn a caller-owned child process. */
export const spawn: t.Process.Lib['spawn'] = (config) => spawnWith(DEFAULT_DEPS, config);

/** Package-internal dependency seam for owned-child lifecycle proofs. */
export function spawnWith(deps: SpawnDependencies, config: t.Process.SpawnArgs): H {
  const { silent } = config;
  const decoder = new TextDecoder();
  const $ = Rx.subject<t.Process.Event>();
  const stdioHandlers = new Set<E>();
  const readyWaiters = new Set<ReadyWaiter>();
  const failures = createFailureLedger<SpawnFailurePhase>();
  let outputClosed = false;

  const owned: OwnedState = {};

  const cleanup = async () => {
    try {
      const deadline = operationDeadline(deps.cleanupTimeout ?? CLEANUP_TIMEOUT);
      const terminationEvents: FailureEvent<SpawnFailurePhase>[] = [];
      if (owned.child && owned.status) {
        try {
          const outcome = await terminateOwnedChild(owned.child, owned.status, {
            deadline,
            graceTimeout: deps.terminationGraceTimeout,
            settleTimeout: deps.terminationSettleTimeout,
            onFailure(failure) {
              terminationEvents.push(failures.record(failure.phase, failure.error));
            },
          });
          // Signal-attempt errors are provisional while owned status remains live. If status settles
          // anyway, discard only those exact termination observations.
          if (outcome.status?.ok) failures.discard(terminationEvents);
        } catch (error) {
          failures.record('termination', error);
        }
      }

      const drain = owned.status?.current?.ok === true;
      try {
        await settleProcessStream(
          'stdout',
          owned.stdout,
          failures,
          deadline,
          deps.streamTimeout,
          drain,
        );
      } catch (error) {
        failures.record('stdout:settle', error);
      }
      try {
        await settleProcessStream(
          'stderr',
          owned.stderr,
          failures,
          deadline,
          deps.streamTimeout,
          drain,
        );
      } catch (error) {
        failures.record('stderr:settle', error);
      }

      if (failures.hasFailures) {
        throw failures.toError(
          'Failed to terminate an owned process and settle its streams.',
          'OwnedProcessCleanupError',
        );
      }
    } finally {
      stdioHandlers.clear();
      readyWaiters.clear();
      outputClosed = true;
      try {
        $.complete();
      } finally {
        releaseOwnedState(owned);
      }
    }
  };

  const cmd = config.args.join(' ');
  const lifecycle = Rx.lifecycleAsync(config.until, cleanup);
  const requestDispose = (reason: unknown) => ownCompletion(lifecycle.dispose(reason));

  const spawnChild = () => {
    try {
      return deps.spawnChild(config);
    } catch (error) {
      // No child capability was returned, so rollback has no fallible resource phase.
      requestDispose(error);
      throw error;
    }
  };
  const child = spawnChild();
  // Do not capture this binding from handle-retained callbacks. Route post-acquisition ownership
  // through `owned` so terminal cleanup can sever the child-capability graph.
  const childStatus = observeChildStatus(child.status);
  owned.child = child;
  owned.status = childStatus;

  const pid = child.pid;
  const setupStreams = (ownedChild: Deno.ChildProcess): StreamSetup => {
    try {
      const stdoutStream = ownedChild.stdout;
      const stdout = { stream: stdoutStream, reader: stdoutStream.getReader() };
      owned.stdout = stdout;

      const stderrStream = ownedChild.stderr;
      const stderr = { stream: stderrStream, reader: stderrStream.getReader() };
      owned.stderr = stderr;
      return { ok: true, stdout, stderr };
    } catch (error) {
      const failure = Err.normalize(error);
      failures.record('setup', failure);
      return { ok: false, error: failure };
    }
  };
  const streamSetup = setupStreams(child);
  const $$ = $.asObservable();

  let readiness: Readiness = { kind: 'pending' };

  const rejectWhenReady = (cause: Error) => {
    if (readiness.kind !== 'pending') return;
    readiness = { kind: 'failed', error: cause };
    for (const waiter of Array.from(readyWaiters)) waiter.reject(cause);
    readyWaiters.clear();
  };

  const markAsReady = () => {
    if (readiness.kind !== 'pending') return;
    const args = { pid, cmd, toString: toStringFactory({ pid, cmd }) };
    readiness = { kind: 'ready', args };

    const callbackFailures: Error[] = [];
    for (const waiter of Array.from(readyWaiters)) {
      try {
        waiter.fn?.(args);
        waiter.resolve(api);
      } catch (error) {
        const failure = Err.normalize(error);
        failures.record('readiness', failure);
        callbackFailures.push(failure);
        waiter.reject(failure);
      }
    }
    readyWaiters.clear();

    if (callbackFailures.length === 1) throw callbackFailures[0];
    if (callbackFailures.length > 1) {
      throw new AggregateError(callbackFailures, 'Process.spawn: readiness callbacks failed.');
    }
  };

  const processOutput = (source: t.Process.StdStream, data: Uint8Array) => {
    if (!silent) Deno.stdout.writeSync(data);
    let _text: undefined | string;
    const event: t.Process.Event = {
      source,
      data,
      toString: () => _text ?? (_text = decoder.decode(data)),
    };
    $.next(event);

    const handlerFailures: Error[] = [];
    for (const item of Array.from(stdioHandlers)) {
      if (item.source !== source) continue;
      try {
        item.fn(event);
      } catch (error) {
        const failure = Err.normalize(error);
        failures.record(`${source}:handler`, failure);
        handlerFailures.push(failure);
      }
    }
    if (handlerFailures.length === 1) throw handlerFailures[0];
    if (handlerFailures.length > 1) {
      throw new AggregateError(handlerFailures, `Process.spawn: ${source} handlers failed.`);
    }
    return event;
  };

  const handleStream = async (kind: t.Process.StdStream, reader: StreamReader) => {
    let operation: OperationResult<void> = { ok: true, value: undefined };
    try {
      while (true) {
        let res: ReadableStreamReadResult<Uint8Array>;
        try {
          res = await reader.read();
        } catch (error) {
          failures.record(`${kind}:read`, error);
          throw error;
        }
        if (res.done) break;
        if (outputClosed) continue;

        const event = processOutput(kind, res.value);
        if (readiness.kind === 'ready') continue;

        const { readySignal } = config;
        if (readySignal === undefined) markAsReady();
        if (Is.str(readySignal) && event.toString() === `${readySignal}\n`) {
          markAsReady();
        }
        if (Is.func(readySignal)) {
          try {
            if (readySignal(event)) markAsReady();
          } catch (error) {
            const failure = Err.normalize(error);
            failures.record('readiness', failure);
            throw failure;
          }
        }
      }
    } catch (error) {
      operation = { ok: false, error };
    }

    let release: OperationResult<void> = { ok: true, value: undefined };
    try {
      reader.releaseLock();
    } catch (error) {
      failures.record(`${kind}:release`, error);
      release = { ok: false, error };
    }

    if (!operation.ok) throw operation.error;
    if (!release.ok) throw release.error;
  };

  const api: H = {
    pid,
    get $() {
      return $$;
    },

    get is() {
      return { ready: readiness.kind === 'ready' };
    },
    whenReady(fn) {
      if (readiness.kind === 'failed') return Promise.reject(readiness.error);
      if (readiness.kind === 'ready') {
        try {
          fn?.(readiness.args);
          return Promise.resolve(api);
        } catch (error) {
          const failure = Err.normalize(error);
          failures.record('readiness', failure);
          requestDispose(failure);
          return Promise.reject(failure);
        }
      }
      return new Promise<H>((resolve, reject) => {
        readyWaiters.add({ fn, resolve, reject });
      });
    },

    onStdOut(fn) {
      if (!outputClosed) stdioHandlers.add({ fn, source: 'stdout' });
      return api;
    },

    onStdErr(fn) {
      if (!outputClosed) stdioHandlers.add({ fn, source: 'stderr' });
      return api;
    },

    dispose: lifecycle.dispose,
    [Symbol.asyncDispose]: lifecycle[Symbol.asyncDispose],
    get dispose$() {
      return lifecycle.dispose$;
    },
    get disposed() {
      return lifecycle.disposed;
    },
  };

  lifecycle.dispose$.pipe(Rx.take(1)).subscribe((event) => {
    if (readiness.kind === 'pending') {
      rejectWhenReady(disposedBeforeReadyError({ pid, cmd, reason: event.payload.reason }));
    }
  });

  if (!streamSetup.ok) {
    rejectWhenReady(streamSetup.error);
    requestDispose(streamSetup.error);
    return api;
  }

  streamSetup.stdout.pump = captureStream(
    'stdout:pump',
    handleStream('stdout', streamSetup.stdout.reader),
    failures,
    requestDispose,
  );
  streamSetup.stderr.pump = captureStream(
    'stderr:pump',
    handleStream('stderr', streamSetup.stderr.reader),
    failures,
    requestDispose,
  );
  void childStatus.promise.then((result) => {
    if (result.ok && readiness.kind === 'ready') {
      requestDispose(result.status);
      return;
    }
    if (result.ok) {
      const reason = childExitedBeforeReadyError({ pid, cmd, status: result.status });
      rejectWhenReady(reason);
      requestDispose(reason);
      return;
    }

    failures.record('status', result.error);
    const reason = childStatusFailedBeforeReadyError({ pid, cmd, cause: result.error });
    if (readiness.kind === 'pending') rejectWhenReady(reason);
    requestDispose(reason);
  });

  return api;
}

/**
 * Helpers:
 */
function captureStream(
  phase: SpawnFailurePhase,
  pump: Promise<void>,
  failures: FailureLedger<SpawnFailurePhase>,
  onFailure: (error: unknown) => void,
): StreamPump {
  return captureOperation(() => pump).then((result) => {
    if (!result.ok) {
      failures.recordThrown(phase, result.error);
      onFailure(result.error);
    }
    return result;
  });
}

async function settleProcessStream(
  source: t.Process.StdStream,
  owned: OwnedStream | undefined,
  failures: FailureLedger<SpawnFailurePhase>,
  deadline: OperationDeadline,
  timeout = STREAM_SETTLE_TIMEOUT,
  drain = false,
) {
  if (!owned) return;
  const { stream, reader, pump } = owned;
  await settleOwnedStream({
    stream,
    reader,
    operation: pump,
    drain,
    deadline,
    timeout,
    observe(result) {
      if (result.ok) return true;
      failures.recordThrown(`${source}:pump`, result.error);
      return false;
    },
    report(phase, error) {
      failures.record(`${source}:${phase}`, error);
    },
    timeoutError(phase) {
      const action = phase === 'cancel' ? 'cancelling' : 'settling';
      return new Error(`Timed out ${action} an owned process stream.`);
    },
  });
}

/** Break the terminal handle's internal ownership graph after output completion. */
function releaseOwnedState(owned: OwnedState) {
  owned.child = undefined;
  owned.status = undefined;
  owned.stdout = undefined;
  owned.stderr = undefined;
}

function ownCompletion(completion: Promise<void>) {
  // Internally initiated disposal owns rejection; returned handles expose this same completion.
  void completion.catch(() => undefined);
}

function toStringFactory(args: { pid: number; cmd: string }) {
  const { pid, cmd } = args;
  return () => {
    return `
process ${c.gray('pid:')}${c.green(String(pid))}
${c.gray(cmd)}
`.substring(1);
  };
}

function childExitedBeforeReadyError(args: {
  pid: number;
  cmd: string;
  status: Deno.CommandStatus;
}) {
  const { pid, cmd, status } = args;
  const signal = status.signal ? ` signal=${status.signal}` : '';
  return new Error(
    `Process.spawn: child exited before ready: pid=${pid} code=${status.code}${signal} cmd=${cmd}`,
  );
}

function childStatusFailedBeforeReadyError(args: { pid: number; cmd: string; cause: unknown }) {
  const { pid, cmd, cause } = args;
  return new Error(`Process.spawn: failed waiting for child before ready: pid=${pid} cmd=${cmd}`, {
    cause,
  });
}

function disposedBeforeReadyError(args: { pid: number; cmd: string; reason: unknown }) {
  const { pid, cmd, reason } = args;
  return new Error(`Process.spawn: disposed before ready: pid=${pid} cmd=${cmd}`, {
    cause: reason,
  });
}
