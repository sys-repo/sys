import type { t } from './common.ts';

export type IgnoredResponse = any;
export type LifecycleStageHandler = IgnoredResponse | (() => Promise<IgnoredResponse>);

/**
 * Toolkit for working with disposable interfaces.
 */
export type DisposeLib = {
  /**
   * Listens to an observable and disposes of the object when fires.
   */
  until(disposable: t.Disposable, until$?: t.UntilObservable): t.Disposable;
  untilAsync(disposable: t.DisposableAsync, until$?: t.UntilObservable): t.DisposableAsync;

  /**
   * Generates a generic disposable interface that is
   * typically mixed into a wider interface of some kind.
   */
  disposable(until$?: t.UntilObservable): t.Disposable;
  disposableAsync(onDispose?: t.LifecycleStageHandler): t.DisposableAsync;
  disposableAsync(until$?: t.UntilObservable, onDispose?: LifecycleStageHandler): t.DisposableAsync;

  /**
   * Generates a disposable interface that maintains
   * and exposes it's disposed state.
   */
  lifecycle(until$?: t.UntilObservable): t.Lifecycle;
  lifecycleAsync(onDispose?: LifecycleStageHandler): t.LifecycleAsync;
  lifecycleAsync(until$?: t.UntilObservable, onDispose?: LifecycleStageHandler): t.LifecycleAsync;

  /**
   * "Completes" a subject by running:
   *
   *    1. subject.next();
   *    2. subject.complete();
   */
  done(dispose$?: t.Subject<void>): void;
};
