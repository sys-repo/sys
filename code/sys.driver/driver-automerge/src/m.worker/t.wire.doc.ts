import type { t } from './common.ts';

type O = Record<string, unknown>;

/**
 * Method names reserved for future doc-level RPC.
 * These are not yet used by `WireCall`/`WireResult`, but define the
 * stable string surface for document operations over the wire.
 */
export type WireDocMethod = 'doc.change' | 'doc.dispose' | 'doc.path' | 'doc.events';

/**
 * Argument tuples per doc method (reserved for doc-level RPC).
 * These are shaped around the existing `CrdtRef` surface:
 * - `doc.change`   → mutate a document by id with a change function or patch descriptor.
 * - `doc.dispose`  → dispose a document ref on the worker side.
 * - `doc.path`     → subscribe to path-based events for a given document.
 * - `doc.events`   → subscribe to the full event stream for a document.
 *
 * NOTE:
 *   These are not yet used by the runtime; they define the contract
 *   we will wire up when the document shim lands.
 */
export type WireDocArgs = {
  'doc.change': [t.StringId, unknown];
  'doc.dispose': [t.StringId];
  'doc.path': [t.StringId, t.ObjectPath | readonly t.ObjectPath[], t.ImmutablePathEventsOptions?];
  'doc.events': [t.StringId];
};

/**
 * Map from doc method name → result payload type.
 * Reserved for document RPC; not yet used by `WireResultOk`.
 */
export type WireDocResultData = {
  'doc.change': void;
  'doc.dispose': void;
  'doc.path': void;
  'doc.events': void;
};

/**
 * Event payloads for per-document streams (`crdt:doc:<id>`).
 *
 * Variants:
 * - 'doc/snapshot' → a full value snapshot for a document id.
 * - 'doc/change'   → a post-change value snapshot (optional deleted flag).
 * - 'doc/deleted'  → a tombstone notification for the document id.
 */
export type WireDocEventPayload<T extends O = O> =
  | WireDocSnapshot<T>
  | WireDocChange<T>
  | WireDocDeleted;

/**
 * Full snapshot of a document's value at a point in time.
 * Typically used as the initial event when a doc stream opens or resyncs.
 */
type WireDocSnapshot<T extends O = O> = {
  readonly type: 'doc/snapshot';
  readonly payload: {
    readonly id: t.StringId;
    readonly value: T;
  };
};

/**
 * Post-change snapshot for a document.
 * Carries the updated value and an optional `deleted` flag when the
 * document has just transitioned into a deleted state.
 */
type WireDocChange<T extends O = O> = {
  readonly type: 'doc/change';
  readonly payload: {
    readonly id: t.StringId;
    readonly value: T;
    readonly deleted?: boolean;
  };
};

/**
 * Tombstone notification for a document.
 * Indicates that the document with the given id has been deleted.
 */
type WireDocDeleted = {
  readonly type: 'doc/deleted';
  readonly payload: {
    readonly id: t.StringId;
  };
};
