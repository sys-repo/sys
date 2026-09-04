import { Dispose, Schedule, type t, Time } from '../common.ts';
import { failure, hostFailure, isFailure } from './u.snapshot.failure.ts';
import type { SnapshotInput } from './u.snapshot.input.ts';

const now = globalThis.performance.now.bind(globalThis.performance);
const TIMEOUT = Symbol('fs-snapshot-timeout');

/** Capture one monotonic public-operation start before option snapshotting. */
export function snapshotStart(): number {
  return now();
}

/** Round a positive fractional deadline remainder into the host timer domain. */
export function deadlineTimerMsecs(remaining: number): t.Msecs {
  return Math.min(Time.Delay.MAX, Math.ceil(remaining)) as t.Msecs;
}

export type SnapshotContext = {
  readonly signal: AbortSignal;
  readonly checkpoint: () => void;
  readonly yield: () => Promise<void>;
};

/** Run one file snapshot inside an owned cancellation/deadline lifecycle. */
export async function snapshotOperation<T>(
  options: SnapshotInput,
  fn: (context: SnapshotContext) => Promise<T>,
  started = snapshotStart(),
): Promise<T> {
  let life: t.Abortable;
  try {
    life = Dispose.abortable(options.until);
  } catch {
    throw failure('invalid-options');
  }

  let terminal: t.Fs.Snapshot.Failure.Error | undefined;
  const onAbort = () => {
    terminal ??= life.signal.reason === TIMEOUT ? failure('timeout') : failure('cancelled');
  };
  life.signal.addEventListener('abort', onAbort, { once: true });
  if (life.signal.aborted) onAbort();

  let stoppingDeadline = false;
  let timer: ReturnType<typeof Time.delay> | undefined;
  const deadline = (async () => {
    while (!stoppingDeadline && !life.signal.aborted) {
      const remaining = options.timeout - (now() - started);
      if (remaining <= 0) {
        life.dispose(TIMEOUT);
        return;
      }
      timer = Time.delay(deadlineTimerMsecs(remaining), undefined, life.signal);
      await timer;
    }
  })();

  const checkpoint = () => {
    if (life.signal.aborted) {
      onAbort();
      throw terminal!;
    }
    if (now() - started >= options.timeout) {
      life.dispose(TIMEOUT);
      onAbort();
      throw terminal!;
    }
  };
  const yieldTurn = async () => {
    await Schedule.tick();
    checkpoint();
  };
  const context: SnapshotContext = Object.freeze({
    signal: life.signal,
    checkpoint,
    yield: yieldTurn,
  });

  try {
    await Schedule.tick();
    checkpoint();
    const result = await fn(context);
    checkpoint();
    return result;
  } catch (cause) {
    if (isFailure(cause)) throw cause;
    if (terminal) throw terminal;
    throw hostFailure(cause);
  } finally {
    stoppingDeadline = true;
    timer?.cancel();
    await deadline;
    life.signal.removeEventListener('abort', onAbort);
    life.dispose();
  }
}
