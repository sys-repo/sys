import type { t } from './common.ts';

type O = Record<string, unknown>;
type P = t.Automerge.Patch;

/** A string representing a CRDT (Automerge) document-id. */
export type StringDocumentId = string;

type RefProps = t.Lifecycle & {
  readonly id: t.StringDocumentId;
  readonly deleted: boolean;
};

/**
 * An immutable CRDT document reference:
 */
export type CrdtRef<T extends O = O> = t.ImmutableRef<T, P, CrdtEvents<T>> & RefProps;

/** A single change patch within a CRDT change. */
export type CrdtPatch = P;

/** Data thrown off when a CRDT document changes */
export type CrdtChange<T extends O = O> = t.ImmutableChange<T, P> & {
  readonly source: t.Automerge.PatchSource;
};

/** Fired when a CRDT document is deleted */
export type CrdtDeleted = { readonly id: t.StringId };

/** Event interface for a CrdtRef. */
export type CrdtEvents<T extends O = O> = t.ImmutableEvents<T, P, CrdtChange<T>> & {
  readonly deleted$: t.Observable<t.CrdtDeleted>;

  /**
   * Generate a filter for the given path(s).
   * Option: `exact` path:
   *   - true: must have exact match
   *   - false (default):
   */
  path(
    path: t.ObjectPath | t.ObjectPath[],
    options?: t.CrdtPathEventsOptions | boolean,
  ): CrdtPathEvents<T>;
};
/** Options passed to the `Events.path` method. */
export type CrdtPathEventsOptions = { exact?: boolean };

/**
 * Events filtered to on value path(s) within the document.
 */
export type CrdtPathEvents<T extends O = O> = {
  readonly $: t.Observable<CrdtChange<T>>;
  readonly match: { readonly paths: t.ObjectPath[]; readonly exact: boolean };
};
