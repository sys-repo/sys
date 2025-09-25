import { type t } from './common.ts';

/**
 * Build a ScheduleFn for a given mode and optional lifecycle.
 */
export function makeScheduleFn(mode: t.ScheduleMode, life?: t.LifeLike): t.ScheduleFn {
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
    return new Promise<void>((resolve) => {
      scheduleInternal(mode, () => resolve());
    });
  }) as t.ScheduleFn;

  return fn;
}

/**
 * Internal: schedule a function in the chosen mode.
 */
function scheduleInternal(mode: t.ScheduleMode, f: () => void) {
  if (mode === 'micro') {
    if (typeof queueMicrotask === 'function') queueMicrotask(f);
    else Promise.resolve().then(f);
    return;
  }

  if (mode === 'raf') {
    const raf = (globalThis as any).requestAnimationFrame as
      | ((cb: FrameRequestCallback) => number)
      | undefined;

    if (typeof raf === 'function') {
      // Frame-aligned; no extra macro hop.
      raf(() => f());
      return;
    }

    // Non-DOM fallback ≈ one frame.
    setTimeout(f, 16);
    return;
  }

  // "macro"
  setTimeout(f, 0);
}
