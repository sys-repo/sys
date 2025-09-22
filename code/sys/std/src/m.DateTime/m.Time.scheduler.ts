import type { t } from './common.ts';

export const scheduler: t.TimeLib['scheduler'] = (life, mode = 'micro') => {
  const scheduleFn = ((cb?: () => void): any => {
    if (typeof cb === 'function') {
      // Fire & forget form:
      scheduleInternal(mode, () => {
        if (life.disposed) return;
        try {
          cb();
        } catch (err) {
          throw err; // Let errors surface.
        }
      });
      return;
    }

    // Awaitable hop form:
    return new Promise<void>((resolve) => {
      scheduleInternal(mode, () => resolve()); // IMPORTANT: hop should resolve even if disposed
    });
  }) as t.ScheduleFn;

  return scheduleFn;
};

/**
 * Helpers:
 */
function scheduleInternal(mode: t.ScheduleMode, f: () => void) {
  if (mode === 'micro') {
    queueMicrotask(f);
    return;
  }

  if (mode === 'raf') {
    const raf = (globalThis as any).requestAnimationFrame as
      | ((cb: FrameRequestCallback) => number)
      | undefined;

    if (typeof raf === 'function') {
      // Keep RAF purely “frame-aligned”; no extra setTimeout hop
      raf(() => f());
      return;
    }

    // Non-browser fallback
    setTimeout(f, 16); // ~one frame
    return;
  }

  // Macro:
  setTimeout(f, 0);
}
