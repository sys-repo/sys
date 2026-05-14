import type { t } from './common.ts';

/**
 * Generic service lifecycle and status contracts.
 *
 * These types describe service handles that can be started by one module and
 * observed by another without sharing renderer, CLI, or orchestration code.
 */
export namespace Service {
  /** Coarse runtime state from the service owner's viewpoint. */
  export type State = 'starting' | 'ready' | 'stopping' | 'stopped' | 'error';

  /** Structured, renderer-neutral service status snapshot. */
  export type Status = {
    /** Runtime state from the service owner's viewpoint. */
    readonly state: State;

    /** Optional owner-local display name. Consumers decide if and how to render it. */
    readonly name?: string;

    /** Optional owner-local kind, e.g. `http`, `static`, `proxy`, `fixture`. */
    readonly kind?: string;

    /** Primary served filesystem root, if the service has one. */
    readonly root?: t.StringDir;

    /** Owner config path, if the owner knows it. */
    readonly config?: t.StringPath;

    /** Requestable URLs exposed by the service. */
    readonly urls?: readonly Url[];

    /** Extra owner facts that are not URLs and not lifecycle control. */
    readonly details?: readonly Detail[];

    /** Structured error summary when `state` is `error`. */
    readonly error?: t.StdError;
  };

  /** A requestable service URL. */
  export type Url = {
    readonly href: t.StringUrl;
    readonly label?: string;
  };

  /** Scalar service detail for renderer-owned presentation. */
  export type Detail = {
    readonly label: string;
    readonly value: string;
  };

  /** Synchronous service status snapshot provider. */
  export type StatusProvider = {
    status(): Status;
  };

  /** Full-snapshot service status event. */
  export type StatusEvent = {
    readonly type: 'service:status';
    readonly payload: Status;
  };

  /** Observable stream of full service status snapshots. */
  export type StatusObservable = t.Observable<StatusEvent>;

  /** Optional status surface that a running service handle may expose. */
  export type StatusHandle = {
    status?(): Status;
    readonly status$?: StatusObservable;
  };

  /** Handle surface for observing service completion. */
  export type FinishedHandle = {
    readonly finished: PromiseLike<unknown>;
  };

  /** Handle surface for closing a running service. */
  export type CloseHandle = {
    close(reason?: unknown): unknown | Promise<unknown>;
  };

  /** Handle surface for disposing a running service. */
  export type DisposeHandle = {
    dispose(reason?: unknown): unknown | Promise<unknown>;
  };

  /** Optional lifecycle surface that a running service handle may expose. */
  export type LifecycleHandle = Partial<FinishedHandle & CloseHandle & DisposeHandle>;

  /** Generic running service handle surface. */
  export type Handle = StatusHandle & LifecycleHandle;

  /** Generic lifecycle endpoint for starting a service. */
  export type LifecycleEndpoint<Args = unknown, THandle = Handle> = {
    start(args: Args): THandle | Promise<THandle>;
  };
}
