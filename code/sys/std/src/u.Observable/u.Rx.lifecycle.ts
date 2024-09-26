import { take, type t } from './common.ts';
import { Dispose } from '../u.Dispose/mod.ts';

/**
 * Generates the base mechanism of an disposable observable.
 */
export function disposable(until$?: t.UntilObservable): t.Disposable {
  return Dispose.create(until$);
}

/**
 * Generates a disposable observable that keeps track on the "is disposed" state.
 */
export function lifecycle(until$?: t.UntilObservable): t.Lifecycle {
  const { dispose, dispose$ } = disposable(until$);
  let _disposed = false;
  dispose$.pipe(take(1)).subscribe(() => (_disposed = true));
  return {
    dispose$,
    dispose,
    get disposed() {
      return _disposed;
    },
  };
}

/**
 * "Completes" a subject by running:
 *
 *  1. subject.next();
 *  2. subject.complete();
 *
 */
export function done(dispose$: t.Subject<void>) {
  Dispose.done(dispose$);
}
