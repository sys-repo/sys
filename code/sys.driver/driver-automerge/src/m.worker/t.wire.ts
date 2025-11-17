/**
 * @module
 * Wire-protocol envelope types for CRDT Repo communication.
 * Used by both main-thread clients and worker hosts over a MessagePort.
 */

import type { t } from './common.ts';
import { WIRE_VERSION } from './common.ts';

type O = Record<string, unknown>;

/**
 * Stream identifiers.
 * - 'crdt:repo' → repo-level events (prop$, ready$, network$)
 * - 'crdt:doc:<id>' → per-document event streams
 */
export type WireStream = 'crdt:repo' | `crdt:doc:${t.StringId}`;

/**
 * Method names supported by the repo RPC.
 * Parity with `t.CrdtRepoMethods`.
 */
export type WireRepoMethod = 'whenReady' | 'create' | 'get' | 'delete' | 'sync.enable';

/**
 * Method names reserved for future doc-level RPC.
 * These are not yet used by `WireCall`/`WireResult`, but define the
 * stable string surface for document operations over the wire.
 */
export type WireDocMethod = 'doc.change' | 'doc.dispose' | 'doc.path' | 'doc.events';

/**
 * Argument tuples per repo method.
 */
export type WireRepoArgs = {
  whenReady: [];
  'sync.enable': [boolean?];
  create: [unknown]; // initial document value
  get: [t.StringId, t.CrdtRepoGetOptions?];
  delete: [t.StringId];
};

/**
 * Argument tuples per doc method (reserved for doc-level RPC).
 * These are shaped around the existing `CrdtRef` surface:
 * - `doc.change` → mutate a document by id with a change function or patch descriptor.
 * - `doc.dispose` → dispose a document ref on the worker side.
 * - `doc.path` → subscribe to path-based events for a given document.
 * - `doc.events` → subscribe to the full event stream for a document.
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
 * Combined method discriminant for future use when repo+doc RPC
 * are unified at the call/result layer.
 */
export type WireMethod = WireRepoMethod | WireDocMethod;

/**
 * Map from repo method name → result payload type.
 * NOTE: keep in sync with `WireRepoMethod` and `WireRepoArgs`.
 */
export type WireRepoResultData = {
  whenReady: void;
  'sync.enable': void;
  create: WireRepoCreateResult;
  get: WireRepoGetResult;
  delete: void;
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
 * Result payloads per repo RPC method.
 * Keeps `WireCall`/`WireResult` strongly typed without exploding union types.
 */
export type WireRepoCreateResult = { readonly id: t.StringId };
export type WireRepoGetResult<T extends O = O> = t.CrdtRefGetResponse<T>;

/**
 * Optional, non-semantic metadata for tracing/observability.
 * Safe to ignore; useful for requestId/spanId/origin, etc.
 */
export type WireMeta = Readonly<O>;

/**
 * Standardized wire-level error shape.
 */
export type WireError = {
  readonly kind: WireErrorKind;
  readonly message: string;
  readonly stack?: string;
};

export type WireErrorKind = t.CrdtRepoErrorKind | 'NotImplemented' | 'UNKNOWN';

/**
 * Call / Result correlation.
 */
/** Monotonic correlation id for RPC calls/results. */
export type WireId = number;

/** RPC request envelope sent from client to worker. */
export type WireCall<M extends WireRepoMethod = WireRepoMethod> = {
  readonly version: typeof WIRE_VERSION;
  readonly type: 'call';
  readonly id: WireId;
  readonly method: M;
  readonly args: WireRepoArgs[M];
  readonly timeout?: t.Msecs;
  readonly meta?: WireMeta;
};

/** RPC success result envelope. */
export type WireResultOk<M extends WireRepoMethod = WireRepoMethod> = {
  readonly version: typeof WIRE_VERSION;
  readonly type: 'result';
  readonly id: WireId;
  readonly ok: true;
  readonly data: WireRepoResultData[M];
  readonly meta?: WireMeta;
};

/** RPC error result envelope. */
export type WireResultErr = {
  readonly version: typeof WIRE_VERSION;
  readonly type: 'result';
  readonly id: WireId;
  readonly ok: false;
  readonly error: WireError;
  readonly meta?: WireMeta;
};

/** Discriminated union of result envelopes. */
export type WireResult = WireResultOk | WireResultErr;

/** Serializable prop-change payload for wire events (derived). */
export type WireRepoPropChange = {
  readonly prop: 'ready' | 'status' | 'sync.enabled' | 'sync.peers';
  readonly before: t.CrdtRepoProps;
  readonly after: t.CrdtRepoProps;
};

/**
 * Event message payloads (repo/doc streams).
 * Includes stream lifecycle signals for future resource tracking.
 *
 * NOTE:
 * - There is deliberately no worker-side "health" channel here anymore.
 *   Staleness is derived purely client-side from observed behaviour.
 */
export type WireRepoEventPayload =
  | { readonly type: 'props/change'; readonly payload: WireRepoPropChange }
  | { readonly type: 'props/snapshot'; readonly payload: t.CrdtRepoProps }
  | { readonly type: 'ready'; readonly payload: { readonly ready: boolean } }
  | { readonly type: 'stream/open'; readonly payload: Record<never, never> }
  | { readonly type: 'stream/close'; readonly payload: Record<never, never> }
  | { readonly type: 'stream/error'; readonly payload: { readonly message?: string } }
  | t.CrdtNetworkChangeEvent;

/** Event envelope for repo/doc streams. */
export type WireEvent = {
  readonly version: typeof WIRE_VERSION;
  readonly type: 'event';
  readonly stream: WireStream;
  readonly event: WireRepoEventPayload;
  readonly meta?: WireMeta;
};

/**
 * Cancellation of a prior call(id).
 * Additive and ignorable if not yet implemented.
 */
export type WireCancel = {
  readonly version: typeof WIRE_VERSION;
  readonly type: 'cancel';
  readonly id: WireId;
  readonly meta?: WireMeta;
};

/**
 * Discriminated union of all wire messages.
 */
export type WireMessage = WireCall | WireResult | WireEvent | WireCancel;
