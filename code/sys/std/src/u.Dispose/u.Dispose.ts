import { Subject, flatten, type t } from './common.ts';

export const Dispose: t.DisposeLib = {
  create(until$?: t.UntilObservable) {
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
   * Listens to an observable and disposes of the object when fires.
   */
  until(disposable: t.Disposable, until$?: t.UntilObservable): t.Disposable {
    if (until$) wrangle.flatArray(until$).forEach(($) => $.subscribe(disposable.dispose));
    return disposable;
  },

  /**
   * "Completes" a subject by running:
   *
   *    1. subject.next();
   *    2. subject.complete();
   */
  done(dispose$?: t.Subject<void>) {
    dispose$?.next?.();
    dispose$?.complete?.();
  },
} as const;

/**
 * Helpers
 */
export const wrangle = {
  flatArray($?: t.UntilObservable) {
    const list = Array.isArray($) ? $ : [$];
    return flatten(list).filter(Boolean) as t.Observable<any>[];
  },
} as const;
