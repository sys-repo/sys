import { type t } from './common.ts';

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

  let settled = false; //               ← guard: resolve/reject only once
  let cancelled = false; //             ← local cancellation flag
  let timer: number | null = null; //   ← setTimeout handle (macro path)
  let microQueued = false; //           ← whether a microtask has been queued (micro path)

  let resolvePromise!: () => void;
  let rejectPromise!: (err: unknown) => void;

  // Abort listener cleanup (if a signal is provided).
  let abortCleanup: (() => void) | undefined;

  const finish = (kind: 'completed' | 'cancelled' | 'error', err?: unknown) => {
    if (settled) return;
    settled = true;
    is.done = true;

    // Clean up any abort listener.
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
    // error
    rejectPromise(err);
  };

  const settleCancelled = () => {
    if (settled) return;
    is.cancelled = true;
    is.done = true;
    settled = true;

    // Clean up any abort listener.
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

    // Schedule work:
    if (timeout === undefined) {
      /**
       * MICRO: schedule on the microtask queue.
       * We implement cancellability by checking a flag inside the microtask.
       * If cancelled before it runs, we settle immediately and skip the callback.
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

    // Wire abort listener (if provided).
    if (signal) {
      const onAbort = () => {
        cancelled = true;
        // Clear any pending macro timer immediately.
        if (timer !== null) {
          clearTimeout(timer);
          timer = null;
        }
        settleCancelled();
      };
      signal.addEventListener('abort', onAbort, { once: true });
      abortCleanup = () => signal.removeEventListener('abort', onAbort);

      // Belt & suspenders: handle the case where the signal became aborted
      // between our early check and listener wiring.
      if (signal.aborted) onAbort();
    }
  }) as t.TimeDelayPromise;

  /**
   * Cancel function:
   * - Clears the macro timer (if any) OR short-circuits the microtask result.
   * - Never invokes the callback.
   * - Always resolves the promise (does not reject).
   */
  const cancel = () => {
    if (settled) return;
    cancelled = true;

    // If a macro timer exists, clear it and settle immediately.
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
      settleCancelled();
      return;
    }

    // If a microtask is queued (or about to run), settle now.
    if (microQueued) {
      settleCancelled();
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
    if (isAbortSignal(input)) return { signal: input as AbortSignal };

    // AbortController directly
    if (isAbortController(input)) return { signal: (input as AbortController).signal };

    // Options object shape
    if (typeof input === 'object') {
      const o = input as t.TimeDelayOptions & { signal?: unknown };
      if (isAbortSignal(o.signal)) return { signal: o.signal as AbortSignal };
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

/**
 * Queue a microtask in a cross-runtime way.
 */
function scheduleMicro(fn: () => void) {
  if (typeof (globalThis as any).queueMicrotask === 'function') {
    queueMicrotask(fn);
  } else {
    Promise.resolve().then(fn); // Promise.microtask fallback.
  }
}

const isAbortSignal = (v: unknown): v is AbortSignal => {
  // Be liberal: presence of addEventListener is sufficient for our use.
  return !!v && typeof (v as any).addEventListener === 'function';
};

const isAbortController = (v: unknown): v is AbortController => {
  return !!v && isAbortSignal((v as any).signal);
};
