import { type t, Schedule } from './common.ts';

type FrameDriverDeps = {
  getClock: () => t.VirtualClock | null;
  publish: (s: t.VirtualClockState) => void;
};

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
        last = 0;
        continue;
      }

      const now = performance.now();
      if (last === 0) {
        last = now;
        continue;
      }

      const dt = Math.max(0, now - last) as t.Msecs;
      last = now;

      const next = c.advance(dt);

      micro(() => {
        if (disposed) return;
        publish(next);
      });
    }
  })();

  return () => void (disposed = true);
}
