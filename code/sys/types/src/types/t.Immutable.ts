import type { t } from '../common.ts';

type O = Record<string, unknown>;

/**
 * Immutable object with mutator change function.
 */
export type Immutable<D = O, P = unknown> = {
  readonly current: D;
  change(fn: ImmutableMutator<D>, options?: ImmutableChangeOptionsInput<P>): void;
};

/**
 * Immutable change/mutator functions.
 */
export type ImmutableMutator<D = O> = (draft: D) => void;

/**
 * Loose inputs to the change function (multiple input types).
 */
export type ImmutableChangeOptionsInput<P> = ImmutablePatchCallback<P> | ImmutableChangeOptions<P>;

/**
 * Callback that JSON patches arising from a change operation are returned in.
 */
export type ImmutablePatchCallback<P> = (patches: P[]) => void;

/**
 * Options passed to the Immutable `change` function.
 */
export type ImmutableChangeOptions<P> = { patches?: ImmutablePatchCallback<P> };

/**
 * A reference handle to an Immutable<T> with
 * an observable event factory.
 */
export type ImmutableRef<D = O, P = unknown, E = unknown> = Immutable<D, P> & {
  /** The unique ID of the instance of the handle. */
  readonly instance: string; // Unique ID of the reference handle.

  /** Generate a new Events object. */
  events(dispose$?: t.UntilInput): E;
};

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
  C extends ImmutableChange<D, P> = ImmutableChange<D, P>,
> = t.Lifecycle & { readonly $: t.Observable<C> };

/**
 * Utility type to infer the event-type contained within the ImmutableEvents type.
 */
export type InferImmutableEvent<T extends { $: t.Observable<any> }> = T extends {
  $: t.Observable<infer E>;
}
  ? E
  : never;

/**
 * Represents a before/after patched change to the immutable state.
 */
export type ImmutableChange<D, P> = {
  readonly before: D;
  readonly after: D;
  readonly patches: P[];
};
