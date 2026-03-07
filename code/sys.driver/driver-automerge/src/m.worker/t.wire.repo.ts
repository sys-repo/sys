import type { t, WIRE_VERSION } from './common.ts';

/**
 * Method names supported by the repo RPC.
 * Parity with `t.CrdtRepoMethods`.
 */
export type WireRepoMethod = 'whenReady' | 'create' | 'get' | 'delete' | 'sync.enable';
/** Argument tuples per repo method. */
export type WireRepoArgs = {
  whenReady: [];
  'sync.enable': [boolean?];
  create: [unknown]; // initial document value
  get: [t.StringId, t.CrdtRepoGetOptions?];
  delete: [t.StringId];
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
  | { readonly type: 'props/change'; readonly payload: t.WireRepoPropChange }
  | { readonly type: 'props/snapshot'; readonly payload: t.CrdtRepoProps }
  | { readonly type: 'stream/open'; readonly payload: Record<never, never> }
  | { readonly type: 'stream/ping'; readonly payload: Record<never, never> }
  | { readonly type: 'stream/close'; readonly payload: Record<never, never> }
  | { readonly type: 'stream/error'; readonly payload: { readonly message?: string } }
  | t.CrdtNetworkChangeEvent;

/** Serializable prop-change payload for wire events (derived). */
export type WireRepoPropChange = {
  readonly prop: 'status' | 'sync.enabled' | 'sync.peers';
  readonly before: t.CrdtRepoProps;
  readonly after: t.CrdtRepoProps;
};

/**
 * Map from repo method name → result payload type.
 * NOTE: keep in sync with `WireRepoMethod` and `WireRepoArgs`.
 */
export type WireRepoResultData = {
  whenReady: void;
  'sync.enable': void;
  create: t.WireRepoCreateResult;
  get: t.WireRepoGetResult;
  delete: void;
};

/** RPC request envelope sent from client to worker. */
export type WireRepoCall<M extends t.WireRepoMethod = t.WireRepoMethod> = {
  readonly version: typeof WIRE_VERSION;
  readonly type: 'call';
  readonly id: t.WireId;
  readonly method: M;
  readonly args: t.WireRepoArgs[M];
  readonly timeout?: t.Msecs;
  readonly meta?: t.WireMeta;
};

/** RPC success result envelope. */
export type WireRepoResultOk<M extends t.WireRepoMethod = t.WireRepoMethod> = {
  readonly version: typeof WIRE_VERSION;
  readonly type: 'result';
  readonly id: t.WireId;
  readonly ok: true;
  readonly data: t.WireRepoResultData[M];
  readonly meta?: t.WireMeta;
};

/** RPC error result envelope. */
export type WireRepoResultErr = {
  readonly version: typeof WIRE_VERSION;
  readonly type: 'result';
  readonly id: t.WireId;
  readonly ok: false;
  readonly error: t.WireError;
  readonly meta?: t.WireMeta;
};
