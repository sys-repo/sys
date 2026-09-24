import { Schedule } from '../../m.Async.Schedule/mod.ts';
import { Is, type t } from './common.ts';
import { timerMsecs } from './u.timerMsecs.ts';

type Terminal = 'completed' | 'cancelled' | 'failed';
type State = 'pending' | 'running' | Terminal;

/**
 * Schedule one callback and settle from its synchronous or asynchronous outcome.
 * Cancellation resolves quietly only before the callback starts.
 */
export function delay(...args: unknown[]): t.Time.Delay.Promise {
  return createDelay(args);
}

/** Package-private owner shared by root and scoped delays. */
export function createDelay(
  args: unknown[],
  parent?: t.LifecycleView,
): t.Time.Delay.Promise {
  const { msecs, fn, options } = Wrangle.delayArgs(args);
  const timeout = Wrangle.normalizeMsecs(msecs);
  const { signal } = Wrangle.delayOptions(options);
  const completion = Promise.withResolvers<void>();
  let state: State = 'pending';
  let abortCleanup: (() => void) | undefined;
  let life: t.Lifecycle | undefined;
  let parentBridge: ReturnType<t.DisposeObservable['subscribe']> | undefined;

  const done = () => state !== 'pending' && state !== 'running';
  const is: t.Time.Delay.Handle['is'] = {
    get done() {
      return done();
    },
    get completed() {
      return state === 'completed';
    },
    get cancelled() {
      return state === 'cancelled';
    },
  };

  const cleanup = () => {
    const detach = abortCleanup;
    const scheduled = life;
    const bridge = parentBridge;
    abortCleanup = undefined;
    life = undefined;
    parentBridge = undefined;
    // Preserve the selected outcome even if best-effort teardown fails.
    try {
      detach?.();
    } catch { /* Abort listener teardown must not replace callback settlement. */ }
    try {
      scheduled?.dispose();
    } catch { /* Scheduling teardown must not create a second rejection channel. */ }
    try {
      bridge?.unsubscribe();
    } catch { /* Parent teardown must not replace callback settlement. */ }
  };

  const finish = (next: Terminal, error?: unknown) => {
    if (done()) return;
    state = next;
    cleanup();
    if (next === 'failed') completion.reject(error);
    else completion.resolve();
  };

  const cancel = () => {
    if (state === 'pending') finish('cancelled');
  };

  // The adapter always fulfills: callback failure belongs only to the public Promise.
  const run = async () => {
    if (state !== 'pending') return;
    // Select running before caller code can re-enter through cancel or abort.
    state = 'running';
    try {
      await fn?.();
    } catch (error) {
      finish('failed', error);
      return;
    }
    finish('completed');
  };

  const result: t.Time.Delay.Promise = Object.assign(completion.promise, {
    cancel,
    is,
    timeout: timeout ?? 0,
  });

  try {
    if (parent?.disposed || signal?.aborted) {
      cancel();
    } else {
      if (parent) {
        parentBridge = parent.dispose$.subscribe(cancel);
        if (parent.disposed) cancel();
        // A synchronous disposal can precede assignment of the acquired subscription.
        if (done()) cleanup();
      }
      if (!done() && signal) {
        try {
          signal.addEventListener('abort', cancel, { once: true });
        } finally {
          abortCleanup = () => signal.removeEventListener('abort', cancel);
          if (done()) cleanup();
        }
        if (signal.aborted) cancel();
      }
      if (state === 'pending') {
        life = Schedule.queue(run, { queue: timeout === undefined ? 'micro' : { ms: timeout } });
        // Registration may re-enter cancellation before the lifecycle has been assigned.
        if (done()) cleanup();
      }
    }
  } catch (error) {
    finish('failed', error);
  }

  return result;
}

/**
 * Helpers:
 */
const Wrangle = Object.freeze({
  /** Resolve the milliseconds-first, callback-first, and options-only overloads in one place. */
  delayArgs(input: unknown[]) {
    let msecs: number | undefined = undefined;
    let fn: t.Time.Delay.Callback | undefined;
    let options: unknown;

    // Keep NaN on the numeric path: normalization selects a zero-delay timer, not a microtask.
    if (typeof input[0] === 'number') msecs = input[0];
    else if (Is.func(input[0])) fn = input[0] as t.Time.Delay.Callback;
    else if (input[0] !== undefined) options = input[0];

    if (Is.func(input[1])) fn = input[1] as t.Time.Delay.Callback;
    else if (input[1] !== undefined) options = input[1] ?? options;

    if (input[2] !== undefined) options = input[2];

    return { fn, msecs, options } as const;
  },

  /** Accept signal/controller shortcuts, ignoring unrecognized option fields. */
  delayOptions(input: unknown): { signal?: AbortSignal } {
    if (!input) return {};
    if (Is.abortSignal(input)) return { signal: input };
    if (Is.abortController(input)) return { signal: input.signal };

    if (Is.object(input)) {
      const options: { signal?: unknown } = input;
      if (Is.abortSignal(options.signal)) return { signal: options.signal };
    }

    return {};
  },

  /** Preserve the microtask choice; all numeric delays share the timer policy. */
  normalizeMsecs(msecs?: number): number | undefined {
    if (msecs === undefined) return undefined;
    return timerMsecs(msecs);
  },
});
