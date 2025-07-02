import type { t } from '../common.ts';

type O = Record<string, unknown>;

/**
 * Utility type to infer the event-type contained within the ImmutableEvents type.
 */
export type InferImmutableEvent<T extends { $: t.Observable<any> }> = T extends {
  $: t.Observable<infer E>;
}
  ? E
  : never;

/**
 * Generic immutable events observer.
 *
 * See example reference implementation in:
 *   sys.util → Immutable.events(💥):💦
 *
 */
export type ImmutableEvents<
  D,
  P,
  C extends t.ImmutableChange<D, P> = t.ImmutableChange<D, P>,
> = t.Lifecycle & {
  /** Observable stream of change events. */
  readonly $: t.Observable<C>;
};

/**
 * Events filtered on a subset of path(s) within the document.
 */
export type ImmutablePathEvents<
  D,
  P,
  C extends t.ImmutableChange<D, P> = t.ImmutableChange<D, P>,
> = {
  readonly $: t.Observable<C>;
  readonly match: { readonly paths: t.ObjectPath[]; readonly exact: boolean };
};
