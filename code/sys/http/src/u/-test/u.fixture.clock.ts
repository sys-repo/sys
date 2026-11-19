import type { t } from '../../common.ts';

type MonotonicClock = t.Disposable & {
  readonly set: (now: t.Msecs) => void;
};

/** Override performance.now for serial tests; restore its exact descriptor, leaving timers real. */
export function monotonicClock(): MonotonicClock {
  const descriptor = Object.getOwnPropertyDescriptor(performance, 'now');
  let now = 0;
  Object.defineProperty(performance, 'now', { configurable: true, value: () => now });
  const dispose = () => {
    if (descriptor) Object.defineProperty(performance, 'now', descriptor);
    else Reflect.deleteProperty(performance, 'now');
  };
  return {
    set(value) {
      now = value;
    },
    dispose,
    [Symbol.dispose]: dispose,
  };
}
