import type { t } from './common.ts';

/**
 * Type contracts for disposable lifecycle helpers.
 */
export declare namespace Dispose {
  /**
   * Toolkit for working with disposable interfaces.
   */
  export type Lib = {
    /** Generate a disposable lifecycle with standard AbortController/Signal mechanics. */
    abortable(until?: t.UntilInput): t.Abortable;

    /**
     * Generates a generic disposable interface that is
     * typically mixed into a wider interface of some kind.
     */
    disposable(until?: t.UntilInput): t.Disposable;

    /** An async variant of the dispose pattern. */
    disposableAsync(onDispose?: t.LifecycleStageHandler): t.DisposableAsync;
    disposableAsync(
      until?: t.UntilInput,
      onDispose?: LifecycleStageHandler,
    ): t.DisposableAsync;

    /**
     * Generates a disposable interface that maintains
     * and exposes it's disposed state.
     */
    lifecycle(until?: t.UntilInput): t.Lifecycle;

    /** An async variant of the lifecycle pattern. */
    lifecycleAsync(onDispose?: LifecycleStageHandler): t.LifecycleAsync;
    lifecycleAsync(
      until?: t.UntilInput,
      onDispose?: LifecycleStageHandler,
    ): t.LifecycleAsync;

    /** Extend the given object to be expose the lifecycle API. */
    toLifecycle<T extends t.Lifecycle>(api: t.OmitLifecycle<T>): T;
    toLifecycle<T extends t.Lifecycle>(life: t.Lifecycle, api: t.OmitLifecycle<T>): T;
    toLifecycleView<T extends t.LifecycleView>(life: t.Lifecycle, api: t.OmitLifecycle<T>): T;

    /**
     * Listens to an observable and disposes of the object when fires.
     */
    until(until?: t.UntilInput): t.Observable<unknown>[];

    /**
     * Emit `{ reason }` once, then complete.
     * Safe to call with `undefined` reason.
     */
    done(dispose$?: t.Subject<t.DisposeEvent>, reason?: unknown): void;

    /**
     * Safely remove direct and native disposal authority from a disposable.
     * NB: useful for surfacing an observable lifecycle without exposing cleanup control.
     */
    omitDispose<T extends t.Disposable | t.DisposableAsync>(
      obj: T,
    ): Omit<T, 'dispose' | typeof Symbol.dispose | typeof Symbol.asyncDispose>;
  };
}

/** Callback invoked upon disposal of a lifecycle object  */
export type LifecycleStageHandler = (e: t.DisposeEvent) => t.IgnoredResult;
