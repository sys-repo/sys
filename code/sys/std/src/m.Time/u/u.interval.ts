import { Is, type t } from '../common.ts';
import { timerMsecs } from '../m.Delay/u.timerMsecs.ts';

type IntervalInput =
  | t.Time.Interval.Callback
  | AbortSignal
  | AbortController
  | t.Time.Interval.Options;

type State = 'active' | 'cancelled' | 'failed';
type Then = (resolve: (value: unknown) => void, reject: (reason: unknown) => void) => unknown;

/**
 * Run a synchronous callback on a fixed interval, stopping before reporting its first failure.
 */
export function interval(
  msecs: t.Msecs,
  fnOrOptions: IntervalInput,
  optionsOrFn?: IntervalInput,
): t.Time.Interval.Handle {
  const every = wrangle.normalizeMsecs(msecs);
  const { fn, signal, immediate } = wrangle.input(fnOrOptions, optionsOrFn);

  let state: State = 'active';
  let timer: ReturnType<typeof setInterval> | undefined;
  let abortCleanup: (() => void) | undefined;
  const active = () => state === 'active';
  const is: t.Time.Interval.Handle['is'] = {
    get cancelled() {
      return state === 'cancelled';
    },
    get failed() {
      return state === 'failed';
    },
    get done() {
      return !active();
    },
    get running() {
      return active();
    },
  };

  const cleanup = () => {
    const scheduled = timer;
    const detach = abortCleanup;
    timer = undefined;
    abortCleanup = undefined;
    // Attempt both releases without replacing the callback's failure with a teardown failure.
    try {
      if (scheduled !== undefined) clearInterval(scheduled);
    } catch { /* Best-effort timer teardown. */ }
    try {
      detach?.();
    } catch { /* Best-effort listener teardown. */ }
  };

  const stop = (next: 'cancelled' | 'failed') => {
    if (state === 'failed' || state === next) return;
    // An admitted callback's failure still wins if it cancelled or aborted its own interval.
    state = next;
    cleanup();
  };
  const cancel = () => stop('cancelled');

  const tick = () => {
    if (!active()) return;
    try {
      const result: unknown = fn();
      if (Is.object(result) || Is.func(result)) {
        const then: unknown = Reflect.get(result, 'then');
        if (Is.func(then)) {
          stop('failed');
          // Read `then` once and preserve its receiver while consuming unsupported async work.
          consumeThenable((resolve, reject) => Reflect.apply(then, result, [resolve, reject]));
          throw new TypeError(
            'Time.interval callbacks must be synchronous; thenables are unsupported',
          );
        }
      }
    } catch (error) {
      stop('failed');
      throw error;
    }
  };

  try {
    if (signal?.aborted) {
      cancel();
    } else {
      if (signal) {
        try {
          signal.addEventListener('abort', cancel, { once: true });
        } finally {
          // Registration may notify before acquiring its listener, or throw after acquiring it.
          abortCleanup = () => signal.removeEventListener('abort', cancel);
          if (!active()) cleanup();
        }
        if (signal.aborted) cancel();
      }
      if (active() && immediate) tick();
      if (active()) {
        timer = setInterval(tick, every);
        // Registration may cancel before its timer handle has been assigned.
        if (!active()) cleanup();
      }
    }
  } catch (error) {
    stop('failed');
    throw error;
  }

  return { cancel, interval: every, is };
}

/**
 * Helpers:
 */

/** Observe resolver-driven settlement and any work returned by the invoked method. */
function consumeThenable(then: Then): void {
  const observe: Then = (resolve, reject) => {
    void consumeResult(then(resolve, reject));
  };
  void consumeResult({ then: observe });
}

async function consumeResult(result: unknown): Promise<void> {
  try {
    await result;
  } catch {
    // The synchronous contract TypeError is the sole report for unsupported async work.
  }
}

const wrangle = {
  input(
    fnOrOptions: IntervalInput,
    optionsOrFn?: IntervalInput,
  ): { fn: t.Time.Interval.Callback; signal?: AbortSignal; immediate: boolean } {
    if (typeof fnOrOptions === 'function') {
      return {
        fn: fnOrOptions,
        ...wrangle.options(optionsOrFn),
      };
    }

    if (typeof optionsOrFn === 'function') {
      return {
        fn: optionsOrFn,
        ...wrangle.options(fnOrOptions),
      };
    }

    throw new Error('Failed to parse overloads: Time.interval');
  },

  options(input: unknown): { signal?: AbortSignal; immediate: boolean } {
    if (!input) return { immediate: false };
    if (Is.abortSignal(input)) return { signal: input as AbortSignal, immediate: false };
    if (Is.abortController(input)) {
      return { signal: (input as AbortController).signal, immediate: false };
    }
    if (typeof input !== 'object') return { immediate: false };

    const options = input as t.Time.Interval.Options;
    return {
      signal: Is.abortSignal(options.signal) ? options.signal : undefined,
      immediate: options.immediate === true,
    };
  },

  normalizeMsecs(input: number): t.Msecs {
    return timerMsecs(input);
  },
} as const;
