import type { Crdt as Sys } from '@sys/crdt/t';
import type { t } from './common.ts';

type O = Record<string, unknown>;
type P = t.Automerge.Patch;

/** A string representing a CRDT (Automerge) document-id. */
export type StringDocumentId = string;

/** A single change patch within a CRDT change. */
export type CrdtPatch = P;

/** Fired when a CRDT document is deleted. */
export type CrdtDeleted = { readonly id: t.StringId };

/** Options passed to the `Events.path` method. */
export type CrdtPathEventsOptions = { exact?: boolean };

/**
 * Events filtered to value path(s) within the document.
 * (Automerge specialization uses the AM-flavored CrdtChange.)
 */
export type CrdtPathEvents<T extends O = O> = {
  readonly $: t.Observable<CrdtChange<T>>;
  readonly match: { readonly paths: t.ObjectPath[]; readonly exact: boolean };
};

/** Automerge-specific additions merged into the event surface. */
type EX<T extends O = O> = {
  readonly deleted$: t.Observable<CrdtDeleted>;

  /**
   * Generate a filter for the given path(s).
   * Option: `exact` path:
   *   - true: must have exact match
   *   - false (default)
   */
  path(
    path: t.ObjectPath | t.ObjectPath[],
    options?: CrdtPathEventsOptions | boolean,
  ): CrdtPathEvents<T>;
};

/** Automerge-specific fields merged into change payloads. */
type CX = {
  readonly source: t.Automerge.PatchSource;
};

/** Data thrown off when a CRDT document changes (Automerge-specialized). */
export type CrdtChange<T extends O = O> = Sys.Change<T, P, CX>;

/** Event interface for a CrdtRef (Automerge-specialized). */
export type CrdtEvents<T extends O = O> = Sys.Events<T, P, EX<T>, CX>;

/**
 * An immutable CRDT document reference (Automerge-specialized).
 * Uses generic base (id/deleted lifecycle included by the abstract layer).
 */
export type CrdtRef<T extends O = O> = Sys.Ref<T, P, EX<T>, CX>;
