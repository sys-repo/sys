import { Is, Num } from '../common.ts';
import { timerMsecs } from '../m.Delay/u.timerMsecs.ts';
import type { WaitForEffects, WaitForOptions } from './t.waitFor.ts';

type Outcome<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: unknown };
type Observer<T> = { current?: (outcome: Outcome<T>) => void };
type Release = { release?: () => void };

const setTimer = globalThis.setTimeout.bind(globalThis);
const clearTimer = globalThis.clearTimeout.bind(globalThis);
const host: WaitForEffects = {
  now: performance.now.bind(performance),
  wake(msecs, fn) {
    const timer = setTimer(fn, msecs);
    return () => clearTimer(timer);
  },
  listen(signal, fn) {
    const release = () => signal.removeEventListener('abort', fn);
    try {
      signal.addEventListener('abort', fn);
    } catch (error) {
      try {
        release();
      } catch { /* Preserve the acquisition failure. */ }
      throw error;
    }
    return release;
  },
};

/** Package-private observation-window owner and deterministic effect seam. */
export function createWaitFor<T>(
  fn: () => T | Promise<T>,
  options: WaitForOptions = {},
  effects: WaitForEffects = host,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const { now, wake, listen } = effects;
    const start = now();
    const { interval = 30, timeout = 2000, signal } = options;
    if (!Is.num(timeout) || timeout < 0 || timeout > Num.MAX_INT) {
      const message =
        'Time.waitFor: timeout must be finite and between 0 and Number.MAX_SAFE_INTEGER';
      reject(new RangeError(message));
      return;
    }
    const every = timerMsecs(interval);
    const owned = new Set<Release>();
    const observer: Observer<T> = {};
    let done = false;

    const release = (resource: Release) => {
      owned.delete(resource);
      const dispose = resource.release;
      resource.release = undefined;
      try {
        dispose?.();
      } catch { /* Attempt every release without replacing the selected outcome. */ }
    };

    const finish = (outcome: Outcome<T>) => {
      if (done) return;
      done = true;
      // Pending caller work retains only this empty cell, not the completed operation.
      observer.current = undefined;
      const resources = [...owned];
      owned.clear();
      for (const resource of resources) release(resource);
      if (outcome.ok) resolve(outcome.value);
      else reject(outcome.error);
    };

    const remaining = () => timeout - (now() - start);
    const live = () => {
      if (done) return false;
      if (signal?.aborted) finish({ ok: false, error: signal.reason });
      else if (remaining() <= 0) {
        finish({ ok: false, error: new Error('Time.waitFor: timeout exceeded') });
      }
      return !done;
    };

    // Effect failures belong to the same caller-owned Promise, never a scheduled adapter.
    const guard = (action: () => void) => {
      if (done) return;
      try {
        action();
      } catch (error) {
        // Acquisition may change abort/deadline authority before throwing.
        try {
          if (!live()) return;
        } catch { /* A broken effect must not hide the original failure. */ }
        finish({ ok: false, error });
      }
    };

    const acquire = (register: (release: () => void) => () => void) => {
      const resource: Release = {};
      owned.add(resource);
      try {
        resource.release = register(() => release(resource));
      } finally {
        // Registration can re-enter abort before returning its release authority.
        if (!owned.has(resource)) release(resource);
      }
    };

    const schedule = (msecs: number, action: () => void) => {
      acquire((release) => {
        return wake(msecs, () => {
          release();
          guard(action);
        });
      });
    };

    const deadline = () => {
      if (!live()) return;
      // Host wake-ups are bounded hints, not the authority for the logical budget.
      schedule(timerMsecs(Math.ceil(Math.max(0, remaining()))), deadline);
    };

    const accept = (outcome: Outcome<T>) => {
      guard(() => {
        if (!live()) return;
        if (!outcome.ok || outcome.value) finish(outcome);
        else schedule(every, poll);
      });
    };

    const poll = () => {
      if (!live()) return;
      try {
        // Observe even if caller code aborts before returning its work.
        void observe(fn(), observer);
      } catch (error) {
        accept({ ok: false, error });
      }
      // Predicate invocation and then-getter assimilation can consume the whole budget.
      live();
    };

    observer.current = accept;
    guard(() => {
      if (!live()) return;
      if (signal) acquire(() => listen(signal, () => guard(live)));
      if (!live()) return;
      deadline();
      poll();
    });
  });
}

/** This separate scope ensures late Promise reactions retain only a detachable observer cell. */
async function observe<T>(result: T | Promise<T>, observer: Observer<T>): Promise<void> {
  let outcome: Outcome<T>;
  try {
    outcome = { ok: true, value: await result };
  } catch (error) {
    outcome = { ok: false, error };
  }
  observer.current?.(outcome);
}
