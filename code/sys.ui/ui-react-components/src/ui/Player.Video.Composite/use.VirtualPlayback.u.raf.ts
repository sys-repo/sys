import { Schedule, type t } from './common.ts';

/**
 * Lifecycle-aware frame driver
 * - Advances the current clock on each frame and publishes snapshots.
 */
type FrameDriverDeps = {
  getClock: () => t.VirtualClock | null;
  publish: (s: t.VirtualClockState) => void;
};

/**
 * Lifecycle-aware frame driver.
 * - Advances the clock each animation frame.
 * - Coalesces updates via microtasks.
 * - Stops cleanly when disposed or when `life` is disposed.
 */
export function startRafClockLoop(life: t.LifeLike | undefined, deps: FrameDriverDeps): () => void {
  const { getClock, publish } = deps;
  const raf = life ? Schedule.make(life, 'raf') : Schedule.raf;
  const micro = life ? Schedule.make(life, 'micro') : Schedule.micro;

  let disposed = false;
  let last = 0;

  (async () => {
    while (!disposed) {
      await raf();
      if (disposed) break;

      const c = getClock();
      if (!c) {
        last = 0; // reset phase if the clock is missing
        continue;
      }

      const now = performance.now();
      if (last === 0) {
        last = now; // prime the loop
        continue;
      }

      const dt = Math.max(0, now - last) as t.Msecs;
      last = now;

      const next = c.advance(dt);
      // Defer publish into microtask for render coalescing
      micro(() => publish(next));
    }
  })();

  return () => void (disposed = true);
}
