import { type t } from '../common.ts';

/**
 * Deterministic schedule so pause-window time authority can be unit-tested.
 */
export function makeDeterministicSchedule() {
  type DriverSchedule = NonNullable<t.CreatePlaybackDriverArgs['schedule']>;
  type Timer = {
    readonly fn: () => void;
    readonly id: number;
    readonly ms: number;
    nextAt: number;
  };

  let nowMs = 0;
  let nextId = 1;
  const timers = new Map<number, Timer>();

  const schedule: DriverSchedule = {
    now: () => nowMs,
    setInterval: (fn, ms) => {
      const id = nextId++;
      timers.set(id, { id, ms, nextAt: nowMs + ms, fn });
      return id;
    },
    clearInterval: (id) => {
      timers.delete(id as number);
    },
  };

  const advance = (deltaMs: number) => {
    nowMs += Math.max(0, deltaMs);

    // Run all due timers in timestamp order (simple, sufficient for unit tests).
    for (;;) {
      let next: Timer | undefined;
      for (const t of timers.values()) {
        if (!next || t.nextAt < next.nextAt) next = t;
      }
      if (!next) return;
      if (next.nextAt > nowMs) return;

      next.fn();
      next.nextAt = next.nextAt + next.ms;
    }
  };

  return { schedule, advance };
}
