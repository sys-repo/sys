import type { t } from './common.ts';

type O = Record<string, unknown>;
type Id = t.Automerge.DocumentId;
type P = t.Automerge.Patch;

type RefProps = t.Lifecycle & { readonly id: Id; readonly deleted: boolean };

/**
 * An immutable CRDT document reference:
 */
export type CrdtRef<T extends O = O> = t.ImmutableRef<T, P, CrdtEvents<T>> & RefProps;

/** A single change patch within a CRDT change. */
export type CrdtPatch = P;

/** Event interface for a CrdtRef. */
export type CrdtEvents<T extends O = O> = t.ImmutableEvents<T, P, CrdtChange<T>>;

/** Data thrown off when a CRDT document changes */
export type CrdtChange<T extends O = O> = t.ImmutableChange<T, P> & {
  readonly source: t.Automerge.PatchSource;
};
