import type { t } from '../common.ts';

/**
 * Delay for a specified amount of time.
 *
 * Semantics:
 * - `delay()` with no number → microtask "tick".
 * - `delay(ms)` with a number ≥ 0 → macrotask via setTimeout(ms).
 *
 * Cancellation:
 * - Works for both micro and macro variants.
 * - If cancelled before the scheduled task runs, the promise resolves immediately,
 *   `is.cancelled` becomes true, and any callback will NOT be invoked.
 *
 * Errors:
 * - If the callback throws, the promise rejects with that error, and `is.done` is set.
 */
export function delay(...args: any[]): t.TimeDelayPromise {
  const { msecs, fn } = Wrangle.delayArgs(args);
  const timeout = Wrangle.normalizeMsecs(msecs);

  // Mutable runtime state to satisfy the extended API.
  const is: t.DeepMutable<t.TimeDelay['is']> = {
    done: false,
    completed: false,
    cancelled: false,
  };

  let settled = false; // guard: resolve/reject only once
  let cancelled = false; // local cancellation flag
  let timer: number | null = null; // setTimeout handle (macro path)
  let microQueued = false; // whether a microtask has been queued (micro path)

  let resolvePromise!: () => void;
  let rejectPromise!: (err: unknown) => void;

  const p = new Promise<void>((resolve, reject) => {
    resolvePromise = resolve;
    rejectPromise = reject;

    const finish = (kind: 'completed' | 'cancelled' | 'error', err?: unknown) => {
      if (settled) return;
      settled = true;
      is.done = true;

      if (kind === 'completed') {
        is.completed = true;
        resolve();
      } else if (kind === 'cancelled') {
        is.cancelled = true;
        resolve();
      } else {
        // error
        reject(err);
      }
    };

    if (timeout === undefined) {
      /**
       * MICRO: schedule on the microtask queue.
       * We implement cancellability by checking a flag inside the microtask.
       * If cancelled before it runs, we resolve immediately and skip the callback.
       */
      microQueued = true;
      scheduleMicro(() => {
        microQueued = false;
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
      });
    } else {
      /**
       * MACRO: schedule via setTimeout(timeout).
       */
      timer = setTimeout(() => {
        timer = null;
        if (cancelled) {
          // If cancelled after the timeout fired but before we ran, treat as cancelled.
          finish('cancelled');
          return;
        }
        try {
          fn?.();
          finish('completed');
        } catch (err) {
          finish('error', err);
        }
      }, timeout) as unknown as number;
    }
  }) as t.TimeDelayPromise;

  /**
   * Cancel function:
   * - Clears the macro timer (if any) OR short-circuits the microtask result.
   * - Never invokes the callback.
   * - Resolves the promise (fulfilled, not rejected).
   */
  const cancel = () => {
    if (settled) return;
    cancelled = true;

    // If a macro timer exists, clear it and settle immediately.
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
      is.cancelled = true;
      is.done = true;
      settled = true;
      resolvePromise();
      return;
    }

    // If a microtask is queued (or about to run), settle now.
    if (microQueued) {
      is.cancelled = true;
      is.done = true;
      settled = true;
      resolvePromise();
      return;
    }

    // NB: If neither path is pending (very edge-case), do nothing.
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
  delayArgs(input: any[]) {
    let msecs: number | undefined = undefined;
    let fn: t.TimeDelayCallback | undefined;
    if (typeof input[0] === 'number') msecs = input[0];
    if (typeof input[0] === 'function') fn = input[0];
    if (typeof input[1] === 'function') fn = input[1];
    return { msecs, fn } as const;
  },

  normalizeMsecs(msecs?: number): number | undefined {
    if (msecs === undefined) return undefined; //   micro hop (tick)
    if (!Number.isFinite(msecs)) return 0; //       NaN / ±Infinity → 0
    if (!Number.isInteger(msecs)) return 0; //      fractional → 0
    return msecs <= 0 ? 0 : msecs; //               negatives → 0, otherwise exact
  },
} as const;

/**
 * Queue a microtask in a cross-runtime way.
 * Uses `queueMicrotask` when available, otherwise falls back to a resolved Promise.
 */
function scheduleMicro(fn: () => void) {
  if (typeof (globalThis as any).queueMicrotask === 'function') {
    queueMicrotask(fn);
  } else {
    // Promise.microtask fallback
    Promise.resolve().then(fn);
  }
}
