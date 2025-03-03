import type { t } from './common.ts';

/** Callback invoked upon disposal of a lifecycle object  */
export type LifecycleStageHandler = () => t.IgnoredResult;

/**
 * Toolkit for working with disposable interfaces.
 */
export type DisposeLib = {
  /**
   * Generates a generic disposable interface that is
   * typically mixed into a wider interface of some kind.
   */
  disposable(until$?: t.UntilObservable): t.Disposable;

  /** An async variant of the dispose pattern. */
  disposableAsync(onDispose?: t.LifecycleStageHandler): t.DisposableAsync;
  disposableAsync(until$?: t.UntilObservable, onDispose?: LifecycleStageHandler): t.DisposableAsync;

  /**
   * Generates a disposable interface that maintains
   * and exposes it's disposed state.
   */
  lifecycle(until$?: t.UntilObservable): t.Lifecycle;

  /** An async variant of the lifecycle pattern. */
  lifecycleAsync(onDispose?: LifecycleStageHandler): t.LifecycleAsync;
  lifecycleAsync(until$?: t.UntilObservable, onDispose?: LifecycleStageHandler): t.LifecycleAsync;

  /**
   * Listens to an observable and disposes of the object when fires.
   */
  until($?: t.UntilObservable): t.Observable<unknown>[];

  /**
   * "Completes" a subject by running:
   *
   *    1. subject.next();
   *    2. subject.complete();
   */
  done(dispose$?: t.Subject<void>): void;
};
