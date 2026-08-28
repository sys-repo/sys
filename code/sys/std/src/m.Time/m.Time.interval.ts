import { Is, type t } from './common.ts';
import { timerMsecs } from './m.Delay/u.timerMsecs.ts';

type IntervalInput =
  | t.Time.Interval.Callback
  | AbortSignal
  | AbortController
  | t.Time.Interval.Options;

/** Run a recurring timer after normalizing its duration into 0..`Time.Delay.MAX`. */
export function interval(
  msecs: t.Msecs,
  fnOrOptions: IntervalInput,
  optionsOrFn?: IntervalInput,
): t.Time.Interval.Handle {
  const every = wrangle.normalizeMsecs(msecs);
  const { fn, signal, immediate } = wrangle.input(fnOrOptions, optionsOrFn);

  const is: t.DeepMutable<t.Time.Interval.Handle['is']> = {
    cancelled: false,
    done: false,
    running: false,
  };

  let timer: number | undefined;
  let stopped = false;
  let abortCleanup: (() => void) | undefined;

  const stop = () => {
    if (stopped) return;
    stopped = true;
    is.cancelled = true;
    is.done = true;
    is.running = false;
    if (timer !== undefined) clearInterval(timer);
    try {
      abortCleanup?.();
    } catch {
      /* no-op */
    }
  };

  if (signal?.aborted) {
    stop();
    return {
      cancel: stop,
      interval: every,
      is,
    };
  }

  const tick = () => {
    if (stopped) return;
    fn();
  };

  if (signal) {
    const onAbort = () => stop();
    signal.addEventListener('abort', onAbort, { once: true });
    abortCleanup = () => signal.removeEventListener('abort', onAbort);
    if (signal.aborted) stop();
  }

  if (!stopped && immediate) tick();

  if (!stopped) {
    timer = setInterval(tick, every) as unknown as number;
    is.running = true;
  }

  return {
    cancel: stop,
    interval: every,
    is,
  };
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
