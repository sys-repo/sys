import { Rx } from '../../m.Rx/mod.ts';
import { restoreDescriptor } from '../../m.Async.Schedule/-test/u.fixture.worker.ts';
import type { t } from '../common.ts';
import { Time } from '../mod.ts';

/** Count child bridges at the public Observable boundary, not through Rx internals. */
export function scopeProbe(scope: t.Time.Until = Time.until(), hooks: {
  subscribed?: (notify: () => void) => void;
  released?: () => void;
} = {}) {
  const source = scope.dispose$;
  const descriptor = Object.getOwnPropertyDescriptor(source, 'subscribe');
  const subscribe = source.subscribe.bind(source);
  let active = 0;
  let added = 0;
  let removed = 0;
  const observed = new Rx.Observable<t.DisposeEvent>((subscriber) => {
    active += 1;
    added += 1;
    const subscription = subscribe(subscriber);
    subscriber.add(() => {
      active -= 1;
      removed += 1;
      try {
        subscription.unsubscribe();
      } finally {
        hooks.released?.();
      }
    });
    hooks.subscribed?.(() => subscriber.next({ reason: undefined }));
  });
  Object.defineProperty(source, 'subscribe', {
    configurable: true,
    value: observed.subscribe.bind(observed),
  });
  return {
    scope,
    get active() {
      return active;
    },
    get added() {
      return added;
    },
    get removed() {
      return removed;
    },
    [Symbol.dispose]() {
      try {
        scope.dispose();
      } finally {
        restoreDescriptor(source, 'subscribe', descriptor);
      }
    },
  };
}
