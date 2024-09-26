import type { t } from './common.ts';

/**
 * Toolkit for working with disposable interfaces.
 */
export type DisposeLib = {
  /**
   * Creates a generic disposable interface that is typically
   * mixed into a wider interface of some kind.
   */
  create(until$?: t.UntilObservable): t.Disposable;

  /**
   * Listens to an observable and disposes of the object when fires.
   */
  until(disposable: t.Disposable, until$?: t.UntilObservable): t.Disposable;

  /**
   * "Completes" a subject by running:
   *
   *    1. subject.next();
   *    2. subject.complete();
   */
  done(dispose$?: t.Subject<void>): void;
};
