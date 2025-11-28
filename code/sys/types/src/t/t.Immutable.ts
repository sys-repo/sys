import type { t } from '../common.ts';
export type * from './t.Immutable.events.ts';

type O = Record<string, unknown>;

/**
 * Immutable object with mutator change function.
 */
export type Immutable<T = O, P = unknown> = {
  readonly current: T;
  change(fn: ImmutableMutator<T>, opts?: ImmutableChangeOptionsInput<P>): void;
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
export type ImmutableRef<T = O, P = unknown, E = t.ImmutableEvents<T, P>> = Immutable<T, P> & {
  /** The unique ID of the instance of the handle. */
  readonly instance: string; // Unique ID of the reference handle.
  /** Generate a new change events instance. */
  events(until?: t.UntilInput): E;
};

/**
 * A plain, immutable view of a value.
 *
 * `ImmutableSnapshot<T>` represents the current state of an immutable
 * reference at a single point in time. It contains no event system,
 * no change mechanics, and no identity — just the `current` value.
 *
 * This is the minimal shape required for read-only operations such as
 * graph walks, structural inspection, serialization, or diffing.
 */
export type ImmutableSnapshot<T = O> = { readonly current: T };

/**
 * Represents a before/after patched change to the immutable state.
 */
export type ImmutableChange<T, P> = {
  readonly before: T;
  readonly after: T;
  readonly patches: readonly P[];
};
/**
 * Read-only event payload for immutable changes.
 */
export type ImmutableChangeReadonly<T, P> = {
  readonly before: T;
  readonly after: T;
  readonly patches: readonly P[];
};

/**
 * Read-only immutable snapshot handle (no mutation surface).
 */
export type ImmutableReadonly<T = O> = { readonly current: T };
/**
 * Read-only reference handle.
 * Mirrors ImmutableRef without `change`.
 */
export type ImmutableRefReadonly<
  T = O,
  P = unknown,
  E = t.ImmutableEvents<T, P>,
> = ImmutableReadonly<T> & {
  readonly instance: string;
  events(until?: t.UntilInput): E;
};
