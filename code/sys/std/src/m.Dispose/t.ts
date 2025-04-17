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
  disposable(until$?: t.DisposeInput): t.Disposable;

  /** An async variant of the dispose pattern. */
  disposableAsync(onDispose?: t.LifecycleStageHandler): t.DisposableAsync;
  disposableAsync(until$?: t.UntilObservable, onDispose?: LifecycleStageHandler): t.DisposableAsync;

  /**
   * Generates a disposable interface that maintains
   * and exposes it's disposed state.
   */
  lifecycle(until$?: t.DisposeInput): t.Lifecycle;

  /** An async variant of the lifecycle pattern. */
  lifecycleAsync(onDispose?: LifecycleStageHandler): t.LifecycleAsync;
  lifecycleAsync(until$?: t.DisposeInput, onDispose?: LifecycleStageHandler): t.LifecycleAsync;

  /** Extend the given object to be expose the lifecycle API. */
  toLifecycle<T extends t.Lifecycle>(life: t.Lifecycle, api: t.OmitLifecycle<T>): T;
  toLifecycle<T extends t.Lifecycle>(api: t.OmitLifecycle<T>): T;

  /**
   * Listens to an observable and disposes of the object when fires.
   */
  until(dispose$?: t.DisposeInput): t.Observable<unknown>[];

  /**
   * "Completes" a subject by running:
   *
   *    1. subject.next();
   *    2. subject.complete();
   */
  done(dispose$?: t.Subject<void>): void;

  /**
   * Safely remove the `dispose` method from a disposable.
   * NB: useful for surfacing from an API where you don't want
   *     callers to be able to disose of the resource.
   */
  omitDispose<T extends t.Disposable | t.DisposableAsync>(obj: T): Omit<T, 'dispose'>;
};
