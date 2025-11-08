import type { t } from '../common.ts';

/**
 * Utility type to infer the event-type contained within the ImmutableEvents type.
 */
export type InferImmutableEvent<T extends { $: t.Observable<unknown> }> = T extends {
  $: t.Observable<infer E>;
}
  ? E
  : never;

/**
 * Generic immutable events observer.
 * See example reference implementation in:
 */
export type ImmutableEvents<
  T,
  P,
  C extends t.ImmutableChangeReadonly<T, P> = t.ImmutableChangeReadonly<T, P>,
> = t.Lifecycle & {
  /** Observable stream of change events. */
  readonly $: t.Observable<C>;
  /** Generate an event filter for changes at the specified path(s). */
  path: t.ImmutablePathEventsFactory<T, P, C>;
};

/** Options passed to the `Events.path` method. */
export type ImmutablePathEventsOptions = { exact?: boolean };

/**
 * Events filtered on a subset of path(s) within the document.
 */
export type ImmutablePathEvents<
  T,
  P,
  C extends t.ImmutableChangeReadonly<T, P> = t.ImmutableChangeReadonly<T, P>,
> = {
  readonly $: t.Observable<C>;
  readonly match: { readonly paths: t.ObjectPath[]; readonly exact: boolean };
};

/**
 * Factory for a generator of event filters over changes at the specified path(s).
 *
 * @param path - A single ObjectPath or an array of ObjectPaths to observe.
 * @param opts - Either a boolean for exact-match mode (true = exact only; false = prefix allowed),
 *               or an options object to configure matching behavior.
 * @returns An event emitter that fires when the given path(s) change.
 */
export type ImmutablePathEventsFactory<
  T,
  P,
  C extends t.ImmutableChangeReadonly<T, P> = t.ImmutableChangeReadonly<T, P>,
> = (
  path: t.ObjectPath | t.ObjectPath[],
  opts?: t.ImmutablePathEventsOptions | boolean,
) => t.ImmutablePathEvents<T, P, C>;
