import type { t } from './common.ts';
import { WIRE_VERSION } from './common.ts';

/**
 * @module
 * Wire-protocol envelope types for CRDT Repo communication.
 * Used by both main-thread clients and worker hosts over a MessagePort.
 */

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
 * Argument tuples per method.
 */
export type WireRepoArgs = {
  whenReady: [];
  'sync.enable': [boolean?];
  create: [unknown]; // initial document value
  get: [t.StringId, t.CrdtRepoGetOptions?];
  delete: [t.StringId];
};

/**
 * Optional, non-semantic metadata for tracing/observability.
 * Safe to ignore; useful for requestId/spanId/origin, etc.
 */
export type WireMeta = Readonly<Record<string, unknown>>;

/**
 * Standard error envelope crossing the wire.
 */
/** Standardized wire-level error shape. */
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
export type WireResultOk = {
  readonly version: typeof WIRE_VERSION;
  readonly type: 'result';
  readonly id: WireId;
  readonly ok: true;
  readonly data: unknown;
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
  readonly prop: 'ready' | 'sync.enabled' | 'sync.peers';
  readonly before: t.CrdtRepoProps;
  readonly after: t.CrdtRepoProps;
};

/**
 * Event message payloads (repo/doc streams).
 * Includes stream lifecycle signals for future resource tracking.
 */
export type WireRepoEventPayload =
  | { readonly type: 'props/change'; readonly payload: t.WireRepoPropChange }
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
