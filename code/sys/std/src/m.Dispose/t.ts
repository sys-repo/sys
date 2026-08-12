import type { t } from './common.ts';

/** Type contracts for observable disposal lifecycle helpers. */
export declare namespace Dispose {
  /** Lifecycle factories, signals, and authority-preserving or authority-free projections. */
  export type Lib = {
    /** Create a synchronous lifecycle whose disposal also aborts its signal. */
    abortable(until?: t.UntilInput): t.Abortable;

    /** Create a synchronous disposable owner with observable terminal state. */
    lifecycle(until?: t.UntilInput): t.Lifecycle;

    /** Create an asynchronous disposable owner with observable terminal state. */
    lifecycleAsync(onDispose?: t.LifecycleStageHandler): t.LifecycleAsync;
    lifecycleAsync(
      until?: t.UntilInput,
      onDispose?: t.LifecycleStageHandler,
    ): t.LifecycleAsync;

    /** Add a synchronous owner's disposal authority and observable lifecycle to an object. */
    toLifecycle<T extends t.Lifecycle>(api: t.OmitLifecycle<T>): T;
    toLifecycle<T extends t.Lifecycle>(life: t.Lifecycle, api: t.OmitLifecycle<T>): T;

    /** Normalize inputs to stop signals, including queued truth for already-terminal state. */
    until(until?: t.UntilInput): t.Observable<unknown>[];

    /** Emit one `{ reason }` event and complete the supplied disposal subject. */
    done(dispose$?: t.Subject<t.DisposeEvent>, reason?: unknown): void;

    /** Remove direct and protocol disposal authority while preserving the observable projection. */
    omitDispose<T extends t.Lifecycle | t.LifecycleAsync>(obj: T): t.OmitDisposable<T>;
  };
}

/** Cleanup callback invoked by an asynchronous lifecycle owner. */
export type LifecycleStageHandler = (e: t.DisposeEvent) => t.IgnoredResult;
