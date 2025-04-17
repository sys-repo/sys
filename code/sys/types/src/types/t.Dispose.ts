import type { t } from './common.ts';

/**
 * An object that exposes a "dispose" method.
 */
export type CanDispose = { dispose(): unknown };

/**
 * An object that provides a standard destructor pattern.
 */
export type Disposable = {
  readonly dispose$: t.Observable<void>;
  dispose(): void;
};

/** The "until this fires" input for a disposable resource factory. */
export type DisposeInput = t.UntilObservable | t.Disposable;
export type UntilInput = DisposeInput;

/**
 * An object that provides a standard asynchronous destructor pattern.
 */
export type DisposableAsync = {
  readonly dispose$: t.Observable<DisposeAsyncEvent>;
  dispose(): Promise<void>;
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
type O = t.Observable<any>;
type OList = (O | OList | undefined)[];
