import { Is } from '../common.ts';

/** Observe native listener acquisition and release, with optional registration-time re-entry. */
export function abortProbe(hooks: {
  beforeAdd?: (notify: () => void) => void;
  afterAdd?: () => void;
} = {}) {
  const ctrl = new AbortController();
  const signal = ctrl.signal;
  const add = signal.addEventListener.bind(signal);
  const remove = signal.removeEventListener.bind(signal);
  const listeners = new Map<EventListenerOrEventListenerObject, EventListener>();
  let added = 0;
  let removed = 0;
  let calls = 0;
  Object.defineProperties(signal, {
    addEventListener: {
      value: (...[type, listener, options]: Parameters<AbortSignal['addEventListener']>) => {
        if (type !== 'abort' || !listener) return add(type, listener, options);
        const observed: EventListener = (event) => {
          calls += 1;
          if (Is.func(listener)) Reflect.apply(listener, signal, [event]);
          else listener.handleEvent(event);
        };
        hooks.beforeAdd?.(() => observed(new Event('abort')));
        add(type, observed, options);
        listeners.set(listener, observed);
        added += 1;
        hooks.afterAdd?.();
      },
    },
    removeEventListener: {
      value: (...[type, listener, options]: Parameters<AbortSignal['removeEventListener']>) => {
        if (type !== 'abort' || !listener) return remove(type, listener, options);
        const observed = listeners.get(listener);
        if (observed) {
          removed += 1;
          listeners.delete(listener);
          remove(type, observed, options);
        }
      },
    },
  });
  return {
    ctrl,
    get added() {
      return added;
    },
    get removed() {
      return removed;
    },
    get calls() {
      return calls;
    },
  };
}
