import { type t, Is, Schedule } from './common.ts';

/**
 * Delay for a specified amount of time.
 *
 * Semantics:
 * - `delay()` with no number → microtask "tick".
 * - `delay(ms)` with a number ≥ 0 → macrotask via setTimeout(ms).
 *
 * Cancellation:
 * - Works for both micro and macro variants.
 * - If cancelled (or aborted) before the scheduled task runs, the promise resolves immediately,
 *   `is.cancelled` becomes true, and any callback will NOT be invoked.
 *
 * Errors:
 * - If the callback throws, the promise rejects with that error, and `is.done` is set.
 */
export function delay(...args: any[]): t.TimeDelayPromise {
  const { msecs, fn, options } = Wrangle.delayArgs(args);
  const timeout = Wrangle.normalizeMsecs(msecs);
  const { signal } = Wrangle.delayOptions(options);

  // Mutable runtime state to satisfy the extended API.
  const is: t.DeepMutable<t.TimeDelay['is']> = {
    done: false,
    completed: false,
    cancelled: false,
  };

  let settled = false;
  let cancelled = false;
  let resolvePromise!: () => void;
  let rejectPromise!: (err: unknown) => void;

  // Abort listener cleanup (if a signal is provided).
  let abortCleanup: (() => void) | undefined;

  // Lifecycle for the scheduled task (used for cancellation).
  let life: t.Lifecycle | undefined;

  const finish = (kind: 'completed' | 'cancelled' | 'error', err?: unknown) => {
    if (settled) return;
    settled = true;
    is.done = true;

    try {
      abortCleanup?.();
    } catch {
      /* no-op */
    }

    if (kind === 'completed') {
      is.completed = true;
      resolvePromise();
      return;
    }
    if (kind === 'cancelled') {
      is.cancelled = true;
      resolvePromise();
      return;
    }
    rejectPromise(err);
  };

  const settleCancelled = () => {
    if (settled) return;
    cancelled = true;
    is.cancelled = true;
    is.done = true;
    settled = true;

    try {
      abortCleanup?.();
    } catch {
      /* no-op */
    }

    resolvePromise();
  };

  const p = new Promise<void>((resolve, reject) => {
    resolvePromise = resolve;
    rejectPromise = reject;

    // If already aborted: short-circuit immediately.
    if (signal?.aborted) {
      settleCancelled();
      return;
    }

    // Choose queue strategy via Schedule (micro vs macro).
    const queueConfig = timeout === undefined ? 'micro' : ({ ms: timeout } as const);

    // Schedule the work once, lifecycle-aware.
    life = Schedule.queue(
      () => {
        if (cancelled) {
          finish('cancelled');
          return;
        }
        try {
          fn?.();
          finish('completed');
        } catch (err) {
          finish('error', err);
        }
      },
      { queue: queueConfig },
    );

    // Wire abort listener (if provided).
    if (signal) {
      const onAbort = () => {
        cancelled = true;
        try {
          life?.dispose(); // prevent execution if not yet run
        } catch {
          /* no-op */
        }
        settleCancelled();
      };
      signal.addEventListener('abort', onAbort, { once: true });
      abortCleanup = () => signal.removeEventListener('abort', onAbort);

      // Handle edge where signal aborts between checks.
      if (signal.aborted) onAbort();
    }
  }) as t.TimeDelayPromise;

  /**
   * Cancel function:
   * - Disposes the scheduled lifecycle so the task never runs.
   * - Never invokes the callback.
   * - Always resolves the promise (does not reject).
   */
  const cancel = () => {
    if (settled) return;
    cancelled = true;
    try {
      life?.dispose();
    } catch {
      /* no-op */
    }
    settleCancelled();
  };

  // Decorate the promise with the extended API fields.
  (p as any).cancel = cancel;
  (p as any).is = is;
  (p as any).timeout = timeout ?? 0;

  return p;
}

/**
 * Helpers:
 */
export const Wrangle = {
  /**
   * Parse input into (msecs, fn, options).
   * Supports:
   *   - delay(ms, fn?, options?)
   *   - delay(fn?, options?)
   *   - delay(options)
   */
  delayArgs(input: any[]) {
    let msecs: number | undefined = undefined;
    let fn: t.TimeDelayCallback | undefined;
    let options: unknown;

    // First param:
    if (typeof input[0] === 'number') msecs = input[0];
    else if (typeof input[0] === 'function') fn = input[0];
    else if (input[0] !== undefined) options = input[0];

    // Second param:
    if (typeof input[1] === 'function') fn = input[1];
    else if (input[1] !== undefined) options = input[1] ?? options;

    // Third param (only relevant for ms-first shape):
    if (input[2] !== undefined) options = input[2];

    return { fn, msecs, options } as const;
  },

  /**
   * Normalize options to a consistent shape { signal? }.
   * Accepts:
   *   - TimeDelayOptions
   *   - AbortSignal
   *   - AbortController
   *   - undefined / anything else → {}
   */
  delayOptions(input: unknown): { signal?: AbortSignal } {
    if (!input) return {};

    // AbortSignal directly
    if (Is.abortSignal(input)) return { signal: input as AbortSignal };

    // AbortController directly
    if (Is.abortController(input)) return { signal: (input as AbortController).signal };

    // Options object shape
    if (typeof input === 'object') {
      const o = input as t.TimeDelayOptions & { signal?: unknown };
      if (Is.abortSignal(o.signal)) return { signal: o.signal as AbortSignal };
    }

    return {};
  },

  /**
   * Normalize milliseconds.
   */
  normalizeMsecs(msecs?: number): number | undefined {
    if (msecs === undefined) return undefined; //   micro hop (tick)
    if (!Number.isFinite(msecs)) return 0; //       NaN / ±Infinity → 0
    if (!Number.isInteger(msecs)) return 0; //      fractional → 0
    return msecs <= 0 ? 0 : msecs; //               negatives → 0, otherwise exact
  },
} as const;
