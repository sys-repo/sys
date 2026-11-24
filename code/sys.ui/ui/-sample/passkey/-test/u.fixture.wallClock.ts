import { WebFixture } from '../../-test.ts';
import { Time } from '../common.ts';

/** Control zero-argument `new Date()` reads; leave Date.now(), explicit dates, and timers real. */
export function wallClock(initial = Time.now.timestamp) {
  let now = initial;
  const replacement = new Proxy(Date, {
    construct(target, args, newTarget) {
      return Reflect.construct(target, args.length ? args : [now], newTarget);
    },
  });
  const mock = WebFixture.Property.mock([{
    target: globalThis,
    key: 'Date',
    descriptor: { value: replacement },
  }]);
  return {
    get now() {
      return now;
    },
    set(timestamp: number) {
      now = timestamp;
    },
    [Symbol.dispose]: () => mock.dispose(),
  };
}
