import { Is, type t } from '../common.ts';

const CapturedPromise = Promise;
const CapturedPromiseThen = CapturedPromise.prototype.then;
const CapturedQueueMicrotask = globalThis.queueMicrotask;
const CapturedSetTimeout = globalThis.setTimeout;
const CapturedRequestAnimationFrame = globalThis.requestAnimationFrame;
const microtaskSentinel = new CapturedPromise<void>((resolve) => resolve());
// Keep captured `then` from consulting mutable constructor and species properties.
Object.defineProperty(microtaskSentinel, 'constructor', { value: undefined });
const apply = Reflect.apply;

/** Build a `ScheduleFn` with an optional lifecycle guard. */
export function makeScheduleFn(mode: t.AsyncSchedule, life?: t.LifeLike): t.ScheduleFn {
  const fn = ((callback?: () => void): void | Promise<void> => {
    if (Is.func(callback)) {
      scheduleInternal(mode, () => {
        if (!life?.disposed) callback();
      });
      return;
    }

    return scheduleTurn(mode);
  }) as t.ScheduleFn;

  return fn;
}

/** Create one awaitable hop through captured construction and scheduling bindings. */
function scheduleTurn(mode: t.AsyncSchedule): Promise<void> {
  return new CapturedPromise<void>((resolve) => {
    scheduleInternal(mode, resolve);
  });
}

/** Schedule a callback through the captured host mechanism. */
function scheduleInternal(mode: t.AsyncSchedule, callback: () => void) {
  if (mode === 'micro') {
    if (Is.func(CapturedQueueMicrotask)) {
      apply(CapturedQueueMicrotask, globalThis, [callback]);
    } else {
      void apply(CapturedPromiseThen, microtaskSentinel, [callback]);
    }
    return;
  }

  if (mode === 'raf') {
    if (Is.func(CapturedRequestAnimationFrame)) {
      apply(CapturedRequestAnimationFrame, globalThis, [() => callback()]);
      return;
    }

    // Approximate one frame when requestAnimationFrame was unavailable.
    apply(CapturedSetTimeout, globalThis, [callback, 16]);
    return;
  }

  apply(CapturedSetTimeout, globalThis, [callback, 0]);
}
