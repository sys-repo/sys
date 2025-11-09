/**
 * AM specialization over
 *    ↑  @sys/types/crdt
 *    ↑  @sys/crdt/t
 * (patch = Automerge.Patch, adds deleted$ + path, and source).
 */
import type { Crdt as G } from '@sys/crdt-t/t';
import type { t } from './common.ts';

type O = Record<string, unknown>;
type P = t.Automerge.Patch;

/** A string representing a CRDT (Automerge) document-id. */
export type StringDocumentId = t.StringId;

/** Automerge patch type (AM driver only). Keep out of worker/UI boundaries. */
export type CrdtPatch = P;

/** Fired when a CRDT document is deleted. */
export type CrdtDeleted = G.Deleted;

/** Automerge-specific change payload extensions. */
export type CrdtChangeExtras = CX;
type CX = { readonly source: t.Automerge.PatchSource };

/**
 * Events filtered to value path(s) within the document.
 * (Automerge specialization uses the AM-flavored CrdtChange.)
 */
export type CrdtPathEvents<T extends O = O> = G.PathEvents<T, P, CX>;

/** Automerge-specific event surface extensions. */
export type CrdtEventExtras<T extends O = O> = EX<T>;

type EX<T extends O = O> = {
  readonly deleted$: t.Observable<G.Deleted>;
  /**
   * Generate a filter for the given path(s).
   * Option: `exact` path:
   *   - true: must have exact match
   *   - false (default)
   */
  path(
    path: t.ObjectPath | t.ObjectPath[],
    options?: t.ImmutablePathEventsOptions | boolean,
  ): CrdtPathEvents<T>;
};

/** Data thrown off when a CRDT document changes (Automerge-specialized). */
export type CrdtChange<T extends O = O> = G.Change<T, P, CX>;

/** Event interface for a CrdtRef (Automerge-specialized). */
export type CrdtEvents<T extends O = O> = G.Events<T, P, EX<T>, CX>;

/**
 * An immutable CRDT document reference (Automerge-specialized).
 * Uses generic base (id/deleted lifecycle included by the abstract layer).
 */
export type CrdtRef<T extends O = O> = G.Ref<T, P, EX<T>, CX>;
