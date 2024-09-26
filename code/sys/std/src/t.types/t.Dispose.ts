import type { t } from './common.ts';

/**
 * An object that provides destruction methods.
 */
export type Disposable = {
  readonly dispose$: t.Observable<void>;
  dispose(): void;
};

/**
 * A disposable object that exposes a state (is disposed) property.
 */
export type Lifecycle = Disposable & { readonly disposed: boolean };

/**
 * Utility Type: remove fields from composite object.
 */
export type OmitDisposable<T extends Disposable> = Omit<T, 'dispose' | 'dispose$'>;
export type OmitLifecycle<T extends Lifecycle> = Omit<T, 'dispose' | 'dispose$' | 'disposed'>;

/**
 * TakeUntil:
 *    Input of observable(s) that signal when
 *    another observable should end.
 */
type O = t.Observable<any>;
type OList = (O | OList | undefined)[];
export type UntilObservable = O | OList;
