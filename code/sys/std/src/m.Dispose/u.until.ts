import { Arr, Is, Observable, type t } from './common.ts';
import {
  abortSignalReason,
  addAbortListener,
  enqueueMicrotask,
  isAbortSignalAborted,
  removeAbortListener,
} from './u.async.ts';

/**
 * Listens to an observable (or set of observables) and
 * disposes of the target when any of them fire.
 */
export function until(input?: t.DisposeInput) {
  if (!Is.untilInput(input)) throw new TypeError('Invalid UntilInput');

  const list = Is.array<t.DisposeInput>(input) ? input : [input];
  return Arr.flatten<unknown>(list)
    .filter((item) => item !== undefined)
    .map((item) => wrangle.observable(item));
}

/**
 * Helpers:
 */
const wrangle = {
  observable(input: unknown): t.Observable<unknown> {
    if (Is.lifecycleView(input)) return wrangle.lifecycleView(input);
    if (Is.abortSignal(input)) return wrangle.abortSignal(input);
    return input as t.Observable<unknown>;
  },

  lifecycleView(view: t.LifecycleView): t.Observable<t.DisposeEvent> {
    if (!view.disposed) return view.dispose$;

    return new Observable<t.DisposeEvent>((subscriber) => {
      let disposed = false;
      const done = () => {
        if (disposed) return;
        disposed = true;
        subscriber.next({ reason: undefined });
        subscriber.complete();
      };

      enqueueMicrotask(() => {
        if (!subscriber.closed) done();
      });
      return () => void (disposed = true);
    });
  },

  abortSignal(signal: AbortSignal): t.Observable<t.DisposeEvent> {
    return new Observable<t.DisposeEvent>((subscriber) => {
      let disposed = false;
      const done = () => {
        if (disposed) return;
        disposed = true;
        subscriber.next({ reason: abortSignalReason(signal) });
        subscriber.complete();
      };

      if (isAbortSignalAborted(signal)) {
        enqueueMicrotask(() => {
          if (!subscriber.closed) done();
        });
        return () => void (disposed = true);
      }

      addAbortListener(signal, done);
      return () => {
        disposed = true;
        removeAbortListener(signal, done);
      };
    });
  },
} as const;
