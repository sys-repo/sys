import type { t } from './common.ts';

/** Type contracts for observable disposal lifecycle helpers. */
export declare namespace Dispose {
  /** Bounded capture of cancellation-input containers, retaining live leaf identities. */
  export namespace Snapshot {
    /** Synchronous server-runtime capture; invalid inputs throw `TypeError('Invalid UntilInput')`. */
    export type Lib = {
      /**
       * Copy and freeze containers (256 nodes / 32 array levels); never subscribe or dispose.
       * Throws a fixed-message TypeError: admission refusal has no own `cause`; exceptions from
       * capture are retained by identity in an own `cause`, even when the thrown value is undefined.
       */
      readonly until: (input?: unknown) => Until;
    };

    /** Recursively readonly containers, not frozen leaves or captured cancellation state. */
    export type Until = Exclude<t.UntilInput, readonly unknown[]> | readonly Until[];
  }

  /** Opt-in Deno/Node surface; the universal runtime does not expose Snapshot. */
  export namespace Server {
    export type Lib = Dispose.Lib & { readonly Snapshot: Dispose.Snapshot.Lib };
  }

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
