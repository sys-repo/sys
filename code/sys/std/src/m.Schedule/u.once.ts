import { Rx, type t } from './common.ts';
import { makeScheduleFn } from './u.scheduleFunction.ts';

type F = t.SchedulerLib['once'];

/**
 * Canonical implementation of `Schedule.once`, built on the same scheduling
 * primitives as Schedule.make/micro/raf. No duplicated timing logic.
 */
export const once: F = (...args) => {
  const { task, options } = wrangle.args(args);
  const life = Rx.lifecycle(options.until);
  let fired = false;

  const run = async () => {
    if (fired || life.disposed) return;
    fired = true;
    try {
      await task();
    } finally {
      // Auto-complete after first execution.
      life.dispose();
    }
  };

  const q = options.queue ?? 'micro';

  // Use the canonical schedulers.
  const micro = makeScheduleFn('micro', life);
  const raf = makeScheduleFn('raf', life);

  // Schedule exactly once on the requested queue.
  if (q === 'micro') {
    micro(run);
    return life;
  }

  if (q === 'raf') {
    raf(run);
    return life;
  }

  if (typeof q === 'object' && 'frames' in q) {
    const target = Math.max(0, q.frames | 0);
    if (target === 0) {
      raf(run);
      return life;
    }
    let i = 0;
    const tick = () => {
      if (life.disposed || fired) return;
      if (i++ >= target) run();
      else raf(tick);
    };
    raf(tick);
    return life;
  }

  if (typeof q === 'object' && 'ms' in q) {
    const id = setTimeout(() => run(), Math.max(0, q.ms | 0)) as unknown as number;
    life.dispose$.subscribe(() => clearTimeout(id));
    return life;
  }

  // Fallback: microtask.
  micro(run);
  return life;
};

/**
 * Helpers:
 */
const wrangle = {
  args(input: any[]) {
    const [task, a, b] = input as [
      (() => unknown | Promise<unknown>) | undefined,
      t.ScheduleOnceOptions | t.ScheduleQueue | undefined,
      t.UntilInput | undefined,
    ];

    if (typeof task !== 'function') {
      throw new TypeError('Schedule.once: first argument "task" must be a function.');
    }

    if (isOptions(a)) return { task, options: { queue: a.queue, until: a.until } };
    return { task, options: { queue: a as t.ScheduleQueue, until: b } };
  },
} as const;

function isOptions(input: any): input is t.ScheduleOnceOptions {
  if (!input || typeof input !== 'object') return false;
  if (Array.isArray(input)) return false; // Must not be an array
  const allowedKeys = new Set(['queue', 'until']); // Explicitly allow only { queue?, until? }
  return Object.keys(input).every((k) => allowedKeys.has(k));
}
