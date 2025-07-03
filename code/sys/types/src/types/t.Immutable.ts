import type { t } from '../common.ts';
export type * from './t.Immutable.events.ts';

type O = Record<string, unknown>;

/**
 * Immutable object with mutator change function.
 */
export type Immutable<T = O, P = unknown> = {
  readonly current: T;
  change(fn: ImmutableMutator<T>, options?: ImmutableChangeOptionsInput<P>): void;
};

/**
 * Immutable change/mutator functions.
 */
export type ImmutableMutator<T = O> = (draft: T) => void;

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
export type ImmutableRef<T = O, P = unknown, E = unknown> = Immutable<T, P> & {
  /** The unique ID of the instance of the handle. */
  readonly instance: string; // Unique ID of the reference handle.

  /** Generate a new Events object. */
  events(dispose$?: t.UntilInput): E;
};

/**
 * Represents a before/after patched change to the immutable state.
 */
export type ImmutableChange<T, P> = {
  readonly before: T;
  readonly after: T;
  readonly patches: P[];
};
