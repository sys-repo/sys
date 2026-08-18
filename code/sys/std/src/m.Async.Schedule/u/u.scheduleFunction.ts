import type { t } from '../common.ts';

const NativePromise = Promise;
const NativePromiseThen = NativePromise.prototype.then;
const NativeQueueMicrotask = globalThis.queueMicrotask;
const NativeSetTimeout = globalThis.setTimeout;
const NativeRequestAnimationFrame = globalThis.requestAnimationFrame;
const resolved = new NativePromise<void>((resolve) => resolve());
const apply = Reflect.apply;

/**
 * Build a ScheduleFn for a given mode and optional lifecycle.
 */
export function makeScheduleFn(mode: t.AsyncSchedule, life?: t.LifeLike): t.ScheduleFn {
  const fn = ((cb?: () => void): any => {
    if (typeof cb === 'function') {
      // Fire & forget.
      scheduleInternal(mode, () => {
        if (life?.disposed) return;
        try {
          cb();
        } catch (err) {
          throw err; // Surface errors; no silent swallow.
        }
      });
      return;
    }

    // Awaitable hop (resolves even if disposed).
    return new NativePromise<void>((resolve) => {
      scheduleInternal(mode, () => resolve());
    });
  }) as t.ScheduleFn;

  return fn;
}

/**
 * Internal: schedule a function in the chosen mode.
 */
function scheduleInternal(mode: t.AsyncSchedule, f: () => void) {
  if (mode === 'micro') {
    if (typeof NativeQueueMicrotask === 'function') {
      apply(NativeQueueMicrotask, globalThis, [f]);
    } else {
      void apply(NativePromiseThen, resolved, [f]);
    }
    return;
  }

  if (mode === 'raf') {
    if (typeof NativeRequestAnimationFrame === 'function') {
      // Frame-aligned; no extra macro hop.
      apply(NativeRequestAnimationFrame, globalThis, [() => f()]);
      return;
    }

    // Non-DOM fallback ≈ one frame.
    apply(NativeSetTimeout, globalThis, [f, 16]);
    return;
  }

  // "macro"
  apply(NativeSetTimeout, globalThis, [f, 0]);
}
