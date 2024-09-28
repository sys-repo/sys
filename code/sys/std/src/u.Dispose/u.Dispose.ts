import { Subject, flatten, take, type t } from './common.ts';

export const Dispose: t.DisposeLib = {
  /**
   * Listens to an observable and disposes of the object when fires.
   */
  until(disposable, until$): t.Disposable {
    if (until$) wrangle.flat(until$).forEach(($) => $.subscribe(disposable.dispose));
    return disposable;
  },

  /**
   * Generates a generic disposable interface that is
   * typically mixed into a wider interface of some kind.
   */
  disposable(until$): t.Disposable {
    const dispose$ = new Subject<void>();
    const disposable: t.Disposable = {
      dispose$: dispose$.asObservable(),
      dispose() {
        Dispose.done(dispose$);
      },
    };
    return Dispose.until(disposable, until$);
  },

  /**
   * Generates a disposable interface that maintains
   * and exposes it's disposed state.
   */
  lifecycle(until$) {
    const { dispose, dispose$ } = Dispose.disposable(until$);
    let _disposed = false;
    dispose$.pipe(take(1)).subscribe(() => (_disposed = true));
    return {
      dispose$,
      dispose,
      get disposed() {
        return _disposed;
      },
    };
  },

  /**
   * "Completes" a subject by running:
   *
   *    1. subject.next();
   *    2. subject.complete();
   */
  done(dispose$) {
    dispose$?.next?.();
    dispose$?.complete?.();
  },
};

/**
 * Helpers
 */
export const wrangle = {
  flat($?: t.UntilObservable) {
    const list = Array.isArray($) ? $ : [$];
    return flatten(list).filter(Boolean) as t.Observable<any>[];
  },
} as const;
