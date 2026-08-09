import type { t } from './common.ts';

/**
 * A handle representing a scheduled or deferred action that
 * can be cancelled before it executes.
 */
export type Cancellable = {
  cancel(): void;
};

/**
 * An object that exposes a "dispose" method.
 */
export type CanDispose = { dispose(): unknown };

/**
 * Canonical synchronous resource with explicit/native authority and an observable lifetime.
 *
 * `.dispose(reason)` may carry an application reason; `[Symbol.dispose]()` carries none. Structural
 * implementers must delegate both entrypoints to one cleanup operation and must not expose callable
 * asynchronous disposal authority.
 */
export type Disposable = globalThis.Disposable & {
  readonly [Symbol.asyncDispose]?: never;
  readonly dispose$: t.DisposeObservable;
  dispose(reason?: unknown): void;
};

/**
 * Duck type: anything with a callable `dispose()` method.
 */
export type DisposableLike = { dispose(reason?: unknown): void };

/** Observable carrying a canonical synchronous owner's disposal event. */
export type DisposeObservable = t.Observable<DisposeEvent>;

/**
 * Synchronous disposal observation carrying an optional reason.
 *
 * Owners from `@sys/std/dispose` emit an own `reason` property whose value is `undefined` when no
 * reason was supplied; the structural type also permits external producers to omit that property.
 */
export type DisposeEvent = { readonly reason?: unknown };

/**
 * Lifetime signal observed by factories that create disposable work.
 *
 * An input identifies when the new owner should stop. Passing it does not transfer ownership and
 * does not authorize the consumer to invoke disposal on the input:
 *
 * - a `LifecycleView` contributes its `dispose$` signal and already-terminal state;
 * - an `UntilObservable` contributes its emissions;
 * - an `AbortSignal` contributes its abort event and reason; and
 * - nested arrays combine those signals recursively.
 *
 * `undefined` is accepted as an ergonomic no-op placeholder, not as a termination signal. A full
 * synchronous `Lifecycle` structurally satisfies `LifecycleView`. Stateless disposable owners and
 * direct asynchronous lifecycle objects are not observable lifetime inputs; callers may pass an
 * explicit compatible `dispose$` stream instead.
 */
export type DisposeInput =
  | t.UntilObservable
  | t.LifecycleView
  | AbortSignal
  | undefined
  | DisposeInput[];

/** Optional lifetime signal accepted at public `until` boundaries. */
export type UntilInput = DisposeInput;

/** Definite lifetime signal, excluding the `undefined` placeholder accepted by `UntilInput`. */
export type Until = t.UntilObservable | t.LifecycleView | AbortSignal | Until[];

/**
 * Canonical asynchronous resource with explicit/native authority and observable disposal stages.
 *
 * `.dispose(reason)` and `[Symbol.asyncDispose]()` must enter one cleanup operation and expose its
 * completion promise. Structural implementers must not expose callable synchronous disposal
 * authority.
 */
export type DisposableAsync = globalThis.AsyncDisposable & {
  readonly [Symbol.dispose]?: never;
  readonly dispose$: t.Observable<DisposeAsyncEvent>;
  dispose(reason?: unknown): Promise<void>;
};

/** Asynchronous disposal stage emitted as an ordinary `dispose$` value. */
export type DisposeAsyncEvent = { type: 'dispose'; payload: DisposeAsyncEventArgs };

/**
 * Asynchronous disposal telemetry.
 *
 * `is.ok` is false only for an `error` stage; `is.done` is true for the terminal `complete` and
 * `error` stages. A terminal error contains normalized `DisposeError` telemetry, while the disposal
 * promise retains the original rejection value. Owners from `@sys/std/dispose` omit optional
 * `reason` and `error` fields when their values are undefined.
 */
export type DisposeAsyncEventArgs = {
  is: { ok: boolean; done: boolean };
  stage: t.DisposeAsyncStage;
  reason?: unknown;
  error?: DisposeError;
};

/** Stage of one asynchronous disposal operation. */
export type DisposeAsyncStage = 'start' | 'complete' | 'error';

/** Normalized telemetry for an asynchronous cleanup failure. */
export type DisposeError = { name: 'DisposeError'; message: string; cause?: t.StdError };

/** Synchronous disposable resource with observable terminal state. */
export type Lifecycle = Disposable & { readonly disposed: boolean };

/** Asynchronous disposable resource with observable terminal state. */
export type LifecycleAsync = DisposableAsync & { readonly disposed: boolean };

/**
 * A started lifecycle handle that exposes observed completion.
 *
 * This complements `UntilInput`: `until` is an input that asks work to stop;
 * `finished` is an output that resolves when the work has stopped.
 */
export type WaitableHandle = { readonly finished: PromiseLike<unknown> };

/**
 * Read-only lifecycle projection.
 * Provides disposal state and signal without disposal authority.
 */
export type LifecycleView = Pick<t.Lifecycle, 'disposed' | 'dispose$'>;

/** Minimal contract for disposable objects (subset of Lifecycle). */
export type LifeLike = { readonly disposed: boolean };

type DisposalAuthorityKey = 'dispose' | typeof Symbol.dispose | typeof Symbol.asyncDispose;

/**
 * Construction shape without direct or native disposal authority or `dispose$`.
 *
 * Remaining fields, including `disposed`, are preserved. This differs from the runtime
 * `Dispose.omitDispose` projection in `@sys/std/dispose`, which preserves observable state.
 */
export type OmitDisposable<T extends Disposable | DisposableAsync | object> = Omit<
  T,
  DisposalAuthorityKey | 'dispose$'
>;

/** Construction shape without direct or native disposal authority, `dispose$`, or `disposed`. */
export type OmitLifecycle<T extends Lifecycle | LifecycleAsync | object> = Omit<
  T,
  DisposalAuthorityKey | 'dispose$' | 'disposed'
>;

/**
 * TakeUntil:
 *    Input of observable(s) that signal when
 *    another observable should end.
 */
export type UntilObservable = O | OList;
type O = t.DisposeObservable | t.Observable<any>;
type OList = (O | OList | undefined)[];
