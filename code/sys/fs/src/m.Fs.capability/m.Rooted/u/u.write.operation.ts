import { Rx, type t, Time } from '../common.ts';
import { failure, isFailure } from './u.error.ts';

type Observed = { readonly ok: true; readonly value: unknown } | {
  readonly ok: false;
  readonly cause: unknown;
};
type Terminal = { readonly kind: t.FsRooted.FailureKind; readonly cause?: unknown };
const now = globalThis.performance.now.bind(globalThis.performance);
const INTERRUPTED = Symbol('interrupted');

/** Start the deadline at public invocation, before any input admission. */
export const treeWriteStart = (): number => now();

/** One owner-controlled terminal; producer-thrown error shapes never supply authority. */
export function treeWriteOperation(
  options: t.FsRooted.TreeWriteOptions,
  activity: t.RootedActivity,
  started: number,
): t.RootedWriteContext {
  const signals = [...activity.ancestors, activity].map((item) => item.controller.signal);
  let life: t.Abortable;
  try {
    life = Rx.abortable([options.until, ...signals]);
  } catch (cause) {
    throw failure('write-tree', 'invalid-options', { cause });
  }
  let terminal: Terminal | undefined;
  let committed = false;
  let stopped = false;
  let deadlineDone = false;
  let timer: t.Time.Delay.Promise | undefined;
  let wake: (() => void) | undefined;
  let cleanupWake: (() => void) | undefined;
  const remaining = () => options.timeout - (now() - started);
  const fail = (kind: t.FsRooted.FailureKind, cause?: unknown): t.FsRooted.Failure => {
    terminal ??= { kind, cause };
    wake?.();
    return failure('write-tree', terminal.kind, { cause: terminal.cause, committed });
  };
  const onAbort = () => {
    fail('cancelled', life.signal.reason);
  };
  life.signal.addEventListener('abort', onAbort);
  if (life.signal.aborted) onAbort();
  const check = () => {
    if (signals.some((signal) => signal.aborted)) fail('cancelled');
    if (remaining() <= 0) fail('timeout');
    if (terminal) throw fail(terminal.kind);
  };
  const deadline = (async () => {
    try {
      while (!stopped) {
        const left = remaining();
        if (left <= 0) {
          fail('timeout');
          cleanupWake?.();
          return;
        }
        timer = Time.delay(Math.min(Time.Delay.MAX, Math.ceil(left)));
        await timer;
      }
    } catch (cause) {
      fail('io-failure', cause);
      cleanupWake?.();
    } finally {
      deadlineDone = true;
    }
  })();

  return {
    check,
    changed: () => {
      committed = true;
    },
    fail,
    async host(fn) {
      check();
      try {
        const result = await fn();
        check();
        return result;
      } catch (cause) {
        // Only owner filesystem helpers enter here; producer exceptions use the separate lane.
        throw fail(
          isFailure(cause)
            ? cause.kind
            : cause instanceof Deno.errors.NotSupported
            ? 'unsupported'
            : 'io-failure',
          cause,
        );
      }
    },
    async producer(fn) {
      check();
      const interrupted = new Promise<typeof INTERRUPTED>((resolve) => {
        wake = () => resolve(INTERRUPTED);
      });
      try {
        const observed = observe(fn);
        // The synchronous prefix can itself abort or exhaust the deadline.
        check();
        const result = await Promise.race([observed, interrupted]);
        check();
        if (result === INTERRUPTED) throw fail('producer-failure');
        if (!result.ok) throw fail('producer-failure', result.cause);
        return result.value;
      } finally {
        wake = undefined;
      }
    },
    async cleanup(fn) {
      // Execute return at most once even at expiry, but never wait indefinitely for it.
      const observed = observe(fn);
      if (deadlineDone || remaining() <= 0) return;
      const expired = new Promise<typeof INTERRUPTED>((resolve) => {
        cleanupWake = () => resolve(INTERRUPTED);
      });
      try {
        await Promise.race([observed, expired]);
      } finally {
        cleanupWake = undefined;
      }
    },
    async dispose() {
      stopped = true;
      timer?.cancel();
      await deadline;
      life.signal.removeEventListener('abort', onAbort);
      life.dispose();
    },
  };
}

/** Every abandoned producer promise retains both fulfillment and rejection observers. */
async function observe(fn: () => unknown): Promise<Observed> {
  try {
    return { ok: true, value: await fn() };
  } catch (cause) {
    return { ok: false, cause };
  }
}
