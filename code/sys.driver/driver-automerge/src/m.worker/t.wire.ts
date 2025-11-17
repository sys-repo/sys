/**
 * @module
 * Wire-protocol envelope types for CRDT Repo communication.
 * Used by both main-thread clients and worker hosts over a MessagePort.
 */
import type { t, WIRE_VERSION } from './common.ts';

type O = Record<string, unknown>;

export type * from './t.wire.doc.ts';
export type * from './t.wire.repo.ts';

/**
 * Stream identifiers.
 * - 'crdt:repo' → repo-level events (prop$, ready$, network$)
 * - 'crdt:doc:<id>' → per-document event streams
 */
export type WireStream = 'crdt:repo' | `crdt:doc:${t.StringId}`;

/**
 * Combined method discriminant for future use when repo+doc RPC
 * are unified at the call/result layer.
 */
export type WireMethod = t.WireRepoMethod | t.WireDocMethod;

/**
 * Result payloads per repo RPC method.
 * Keeps `WireCall`/`WireResult` strongly typed without exploding union types.
 */
export type WireRepoCreateResult = { readonly id: t.StringId };
export type WireRepoGetResult<T extends O = O> = {
  readonly doc?: { readonly id: t.StringId };
  readonly error?: t.CrdtRepoError;
};

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

/** Discriminated union of result envelopes. */
export type WireResult = t.WireRepoResultOk | t.WireRepoResultErr;

/** Event envelope for repo/doc streams. */
export type WireEvent = {
  readonly version: typeof WIRE_VERSION;
  readonly type: 'event';
  readonly stream: t.WireStream;
  readonly event: t.WireRepoEventPayload;
  readonly meta?: WireMeta;
};

/**
 * Cancellation of a prior call(id).
 * Additive and ignorable if not yet implemented.
 */
export type WireCancel = {
  readonly version: typeof WIRE_VERSION;
  readonly type: 'cancel';
  readonly id: t.WireId;
  readonly meta?: t.WireMeta;
};

/**
 * Discriminated union of all wire messages.
 */
export type WireMessage = t.WireRepoCall | WireResult | WireEvent | WireCancel;
