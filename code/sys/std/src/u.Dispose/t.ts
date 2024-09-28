import type { t } from './common.ts';

/**
 * Toolkit for working with disposable interfaces.
 */
export type DisposeLib = {
  /**
   * Listens to an observable and disposes of the object when fires.
   */
  until(disposable: t.Disposable, until$?: t.UntilObservable): t.Disposable;

  /**
   * Generates a generic disposable interface that is
   * typically mixed into a wider interface of some kind.
   */
  disposable(until$?: t.UntilObservable): t.Disposable;

  /**
   * Generates a disposable interface that maintains
   * and exposes it's disposed state.
   */
  lifecycle(until$?: t.UntilObservable): t.Lifecycle;

  /**
   * "Completes" a subject by running:
   *
   *    1. subject.next();
   *    2. subject.complete();
   */
  done(dispose$?: t.Subject<void>): void;
};
