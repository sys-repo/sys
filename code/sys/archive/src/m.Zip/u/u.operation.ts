import { Dispose, Schedule, type t, Time } from '../common.ts';
import { failure, isFailure } from './u.failure.ts';
import type { WorkInput } from './u.input.ts';

const now = globalThis.performance.now.bind(globalThis.performance);
const TIMEOUT = Symbol('zip-timeout');

/** Capture the monotonic start of one public operation before option snapshotting. */
export function operationStart(): number {
  return now();
}

/** Round a positive fractional remaining budget up into the host timer domain. */
export function deadlineTimerMsecs(remaining: number): t.Msecs {
  return Math.min(Time.Delay.MAX, Math.ceil(remaining)) as t.Msecs;
}

export type OperationContext = {
  readonly operation: t.Zip.Operation;
  readonly limits: t.Zip.Limits;
  readonly signal: AbortSignal;
  readonly checkpoint: (entryIndex?: number) => void;
  readonly yieldTurn: (entryIndex?: number) => Promise<void>;
};

/** Run one asynchronous ZIP operation inside an owned cancellation/deadline lifecycle. */
export async function operation<T>(
  name: t.Zip.Operation,
  options: WorkInput,
  limits: t.Zip.Limits,
  fn: (context: OperationContext) => Promise<T>,
  started = operationStart(),
): Promise<T> {
  let life: t.Abortable;
  try {
    life = Dispose.abortable(options.until);
  } catch (cause) {
    throw failure(name, 'invalid-options', { maxErrorChars: limits.maxErrorChars, cause });
  }

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

  const checkpoint = (entryIndex?: number) => {
    if (life.signal.aborted) {
      const kind = life.signal.reason === TIMEOUT ? 'timeout' : 'cancelled';
      throw failure(name, kind, {
        maxErrorChars: limits.maxErrorChars,
        entryIndex,
        cause: life.signal.reason,
      });
    }
    if (now() - started >= options.timeout) {
      life.dispose(TIMEOUT);
      throw failure(name, 'timeout', { maxErrorChars: limits.maxErrorChars, entryIndex });
    }
  };

  const context: OperationContext = Object.freeze({
    operation: name,
    limits,
    signal: life.signal,
    checkpoint,
    async yieldTurn(entryIndex?: number) {
      await Schedule.tick();
      checkpoint(entryIndex);
    },
  });

  try {
    await Schedule.tick();
    checkpoint();
    return await fn(context);
  } catch (cause) {
    if (isFailure(cause)) throw cause;
    throw failure(name, 'malformed', { maxErrorChars: limits.maxErrorChars, cause });
  } finally {
    stoppingDeadline = true;
    timer?.cancel();
    await deadline;
    life.dispose();
  }
}
