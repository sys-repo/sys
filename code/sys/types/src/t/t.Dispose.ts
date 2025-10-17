import type { t } from './common.ts';

/**
 * An object that exposes a "dispose" method.
 */
export type CanDispose = { dispose(): unknown };

/**
 * An object that provides a standard destructor pattern.
 */
export type Disposable = {
  readonly dispose$: t.DisposeObservable;
  dispose(reason?: unknown): void;
};

/**
 * Duck type: anything with a callable `dispose()` method.
 */
export type DisposableLike = { dispose(reason?: unknown): void };

/** An observable that fires when resource is disposed. */
export type DisposeObservable = t.Observable<DisposeEvent>;

/** Event fired through the `dispose$` observable. */
export type DisposeEvent = { readonly reason?: unknown };

/**
 * Input accepted by functions that create or manage disposable resources.
 *
 * The value defines "what to dispose when this fires".
 * For ergonomics, `undefined` is accepted as a no-op placeholder
 * (allowing omitted parameters), but it does *not* represent
 * an actual termination signal.
 *
 * Examples:
 * - `Disposable` — invokes `.dispose()` when triggered.
 * - `UntilObservable` — completes when the observable emits.
 * - `DisposeInput[]` — recursive collection of either.
 */
export type DisposeInput = t.UntilObservable | t.Disposable | undefined | DisposeInput[];
/**
 * Alias for [DisposeInput].
 * Used at API boundaries where an optional "until" parameter is accepted.
 */
export type UntilInput = DisposeInput;
/**
 * The *actual* "until" value — a termination signal.
 *
 * Represents a concrete resource or stream that, when fired or disposed,
 * should cancel or finalize an operation. Unlike [DisposeInput],
 * this excludes `undefined`, ensuring a definite signal source.
 */
export type Until = t.UntilObservable | t.Disposable | Until[];

/**
 * An object that provides a standard asynchronous destructor pattern.
 */
export type DisposableAsync = {
  readonly dispose$: t.Observable<DisposeAsyncEvent>;
  dispose(reason?: unknown): Promise<void>;
};

/**
 * The event object fired through the `dispose$` field.
 */
export type DisposeAsyncEvent = { type: 'dispose'; payload: DisposeAsyncEventArgs };

/**
 * Events arguments for the DisposeAsyncEvent.
 */
export type DisposeAsyncEventArgs = {
  is: { ok: boolean; done: boolean };
  stage: t.DisposeAsyncStage;
  reason?: unknown;
  error?: DisposeError;
};

/**
 * The lifecycle stages of an asynchronous dispose pattern.
 */
export type DisposeAsyncStage = 'start' | 'complete' | 'error';

/**
 * An simple object representation of an error that may have occured while disposing.
 */
export type DisposeError = { name: 'DisposeError'; message: string; cause?: t.StdError };

/**
 * A disposable object that exposes a state (is disposed) property.
 */
export type Lifecycle = Disposable & { readonly disposed: boolean };
export type LifecycleAsync = DisposableAsync & { readonly disposed: boolean };

/** Minimal contract for disposable objects (subset of Lifecycle). */
export type LifeLike = { readonly disposed: boolean };

/**
 * Utility Type: remove fields from composite Dispose object.
 */
export type OmitDisposable<T extends Disposable | DisposableAsync | object> = Omit<
  T,
  'dispose' | 'dispose$'
>;

/**
 * Utility Type: remove fields from composite Lifecycle object.
 */
export type OmitLifecycle<T extends Lifecycle | LifecycleAsync | object> = Omit<
  T,
  'dispose' | 'dispose$' | 'disposed'
>;

/**
 * TakeUntil:
 *    Input of observable(s) that signal when
 *    another observable should end.
 */
export type UntilObservable = O | OList;
type O = t.DisposeObservable | t.Observable<any>;
type OList = (O | OList | undefined)[];
