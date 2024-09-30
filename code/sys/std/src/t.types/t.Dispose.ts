import type { t } from './common.ts';

/**
 * An object that exposes a "dispose" method.
 */
export type CanDispose = { dispose(): unknown };

/**
 * An object that provides destruction methods.
 */
export type Disposable = {
  readonly dispose$: t.Observable<void>;
  dispose(): void;
};
export type DisposableAsync = {
  readonly dispose$: t.Observable<DisposeAsyncEvent>;
  dispose(): Promise<void>;
};

/**
 * The event object fired through the [dispose$] field.
 */
export type DisposeAsyncEvent = { type: 'dispose'; payload: DisposeAsyncEventArgs };
export type DisposeAsyncEventArgs = {
  is: { ok: boolean; done: boolean };
  stage: t.DisposeAsyncStage;
  error?: DisposeError;
};

export type DisposeAsyncStage = 'start' | 'complete' | 'error';
export type DisposeError = { name: 'DisposeError'; message: string; cause?: t.StdError };

/**
 * A disposable object that exposes a state (is disposed) property.
 */
export type Lifecycle = Disposable & { readonly disposed: boolean };
export type LifecycleAsync = DisposableAsync & { readonly disposed: boolean };

/**
 * Utility Type: remove fields from composite object.
 */
export type OmitDisposable<T extends Disposable | DisposableAsync> = Omit<
  T,
  'dispose' | 'dispose$'
>;
export type OmitLifecycle<T extends Lifecycle | LifecycleAsync> = Omit<
  T,
  'dispose' | 'dispose$' | 'disposed'
>;

/**
 * TakeUntil:
 *    Input of observable(s) that signal when
 *    another observable should end.
 */
type O = t.Observable<any>;
type OList = (O | OList | undefined)[];
export type UntilObservable = O | OList;
