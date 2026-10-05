import type { WaitForEffects, WaitForOptions } from '../u/t.waitFor.ts';
import { createWaitFor } from '../u/u.waitFor.ts';

type Wake = { readonly msecs: number; readonly fn: () => void };
type Outcome<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: unknown };

/** Controlled time and delivery are independent; no fixture action silently advances both. */
export function pollingFixture() {
  const ctrl = new AbortController();
  const wakes = new Map<number, Wake>();
  const listeners = new Set<() => void>();
  let time = 0;
  let serial = 0;
  let added = 0;
  let removed = 0;
  let delivered = 0;
  const effects: WaitForEffects = {
    now: () => time,
    wake(msecs, fn) {
      const id = ++serial;
      wakes.set(id, { msecs, fn });
      return () => {
        wakes.delete(id);
      };
    },
    listen(signal, fn) {
      const listener = () => {
        delivered++;
        fn();
      };
      signal.addEventListener('abort', listener);
      listeners.add(listener);
      added++;
      return () => {
        signal.removeEventListener('abort', listener);
        if (listeners.delete(listener)) removed++;
      };
    },
  };
  return {
    ctrl,
    effects,
    wakes,
    set time(value: number) {
      time = value;
    },
    get time() {
      return time;
    },
    get listeners() {
      return { active: listeners.size, added, removed, delivered };
    },
    run<T>(fn: () => T | Promise<T>, options: WaitForOptions = {}) {
      return observeWaiter(createWaitFor(fn, { signal: ctrl.signal, ...options }, effects));
    },
    fire(id: number) {
      const wake = wakes.get(id);
      if (!wake) throw new Error(`Missing fixture wake: ${id}`);
      wakes.delete(id);
      wake.fn();
    },
    [Symbol.dispose]() {
      ctrl.abort();
      wakes.clear();
    },
  };
}

/** Observe without turning an unexpected rejection into a fixture-owned host report. */
export function observeWaiter<T>(promise: Promise<T>) {
  let outcome: Outcome<T> | undefined;
  const completion = (async () => {
    try {
      outcome = { ok: true, value: await promise };
    } catch (error) {
      outcome = { ok: false, error };
    }
  })();
  return {
    completion,
    get outcome() {
      return outcome;
    },
  };
}

/** Drain the bounded native assimilation/observation chain without delivering any timer. */
export async function flushPolling(): Promise<void> {
  for (let count = 0; count < 8; count++) await Promise.resolve();
}
