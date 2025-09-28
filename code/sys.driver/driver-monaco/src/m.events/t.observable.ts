import type { t } from './common.ts';

/** Editor event-bus (Subject). */
export type EditorEventBus = t.Subject<t.EditorEvent>;
/** Editor events observable. */
export type EditorEventObservable = t.Observable<t.EditorEvent>;

/** Utility kinds */
export type WithKind<S extends string = string> = { kind: S };
export type ByKind<E extends WithKind, K extends E['kind']> = Extract<E, { kind: K }>;
export type ByPrefix<E extends WithKind, P extends string> = Extract<E, { kind: `${P}${string}` }>;
