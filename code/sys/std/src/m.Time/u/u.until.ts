import { Dispose } from '../../m.Dispose/mod.ts';
import { Is, type t } from '../common.ts';
import { createDelay } from '../m.Delay/u.delay.ts';
import { createInterval } from './u.interval.ts';

/**
 * Root timer contracts with an additional parent cancellation lifetime.
 */
export function until(until?: t.UntilInput): t.Time.Until {
  const life = Dispose.lifecycle(until);
  try {
    // Dispose queues already-terminal input notifications; immediate timers must not outrun them.
    if (wrangle.terminated(until)) life.dispose();
  } catch (error) {
    life.dispose();
    throw error;
  }

  return {
    delay(...args: unknown[]) {
      return createDelay(args, life);
    },

    interval(msecs, fnOrOptions, optionsOrFn) {
      return createInterval(msecs, fnOrOptions, optionsOrFn, life);
    },

    wait(msecs, options) {
      return createDelay([msecs, undefined, options], life);
    },

    dispose: life.dispose,
    [Symbol.dispose]: life[Symbol.dispose],
    get dispose$() {
      return life.dispose$;
    },
    get disposed() {
      return life.disposed;
    },
  };
}

const wrangle = {
  terminated(input: t.UntilInput): boolean {
    if (Is.array<t.UntilInput>(input)) return input.some(wrangle.terminated);
    if (Is.lifecycleView(input)) return input.disposed;
    if (Is.abortSignal(input)) return input.aborted;
    // Observable-only inputs contribute emissions, not a retroactive disposal state.
    return false;
  },
} as const;
