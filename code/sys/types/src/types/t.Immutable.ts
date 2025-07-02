import type { t } from '../common.ts';
export type * from './t.Immutable.events.ts';

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

/** Loose inputs to the change function (multiple input types). */
export type ImmutableChangeOptionsInput<P> = ImmutablePatchCallback<P> | ImmutableChangeOptions<P>;

/** Callback that JSON patches arising from a change operation are returned in. */
export type ImmutablePatchCallback<P> = (patches: P[]) => void;

/** Options passed to the Immutable `change` function. */
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
 * Represents a before/after patched change to the immutable state.
 */
export type ImmutableChange<D, P> = {
  readonly before: D;
  readonly after: D;
  readonly patches: P[];
};
