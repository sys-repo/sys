import { type t, WIRE_VERSION } from './common.ts';

/**
 * Simple factories for well-formed messages.
 */
export const Wire = {
  Kind: {
    repo: 'crdt:repo' as const,
    attach: 'crdt:attach' as const,
    workerReady: 'crdt:worker:ready' as const,
    doc: (id: t.StringId) => `crdt:doc:${id}` as const,
    isDoc: (s: t.WireStream): s is `crdt:doc:${string}` => s.startsWith('crdt:doc:'),
  },

  Is: {
    /**
     * True when event is a network-level repo event.
     *
     * Note:
     *  - Accepts a structural payload so it can be reused on both wire payloads
     *    and local CrdtRepoEvent objects.
     */
    networkEvent(e: { type: string; payload: unknown }): e is t.CrdtNetworkChangeEvent {
      return (
        e.type === 'network/peer-online' ||
        e.type === 'network/peer-offline' ||
        e.type === 'network/close'
      );
    },

    /** Transport-only lifecycle signals. */
    streamLifecycle(e: { type: string; payload: unknown }): boolean {
      return (
        e.type === 'stream/open' ||
        e.type === 'stream/close' ||
        e.type === 'stream/error' ||
        e.type === 'stream/ping'
      );
    },

    /**
     * True when the event is a CRDT repo API *wire* event (not lifecycle).
     *
     * NOTE:
     *  - This intentionally narrows to the events surfaced to clients.
     */
    repoEvent(e: { type: string; payload: unknown }): e is t.CrdtRepoWireEvent {
      return (
        e.type === 'ready' ||
        e.type === 'props/change' ||
        e.type === 'props/snapshot' ||
        Wire.Is.networkEvent(e)
      );
    },
  },

  call<M extends t.WireRepoMethod>(
    id: t.WireId,
    method: M,
    ...args: t.WireRepoArgs[M]
  ): t.WireRepoCall<M> {
    return {
      version: WIRE_VERSION,
      type: 'call',
      id,
      method,
      args,
    };
  },

  /**
   * Event envelope factory.
   *
   * - stream: 'crdt:repo'      → event: WireRepoEventPayload, returns WireEventRepo
   * - stream: 'crdt:doc:<id>'  → event: WireDocEventPayload,  returns WireEventDoc
   */
  event<S extends t.WireStream>(
    stream: S,
    event: S extends 'crdt:repo' ? t.WireRepoEventPayload : t.WireDocEventPayload,
  ): S extends 'crdt:repo' ? t.WireEventRepo : t.WireEventDoc {
    return { version: WIRE_VERSION, type: 'event', stream, event } as any;
  },

  ok(id: t.WireId, data: t.WireRepoResultData[t.WireRepoMethod]): t.WireResult {
    return { version: WIRE_VERSION, type: 'result', id, ok: true, data };
  },

  err(id: t.WireId, error: t.WireError): t.WireResult {
    return { version: WIRE_VERSION, type: 'result', id, ok: false, error };
  },

  errFrom(e: unknown, kind: t.WireErrorKind = 'UNKNOWN'): t.WireError {
    if (e instanceof Error) {
      return { kind, message: e.message, stack: e.stack };
    }

    if (e && typeof e === 'object') {
      const anyErr = e as { kind?: string; message?: unknown; stack?: unknown };
      if (typeof anyErr.kind === 'string' && typeof anyErr.message === 'string') {
        return {
          kind: anyErr.kind as t.WireErrorKind,
          message: anyErr.message,
          stack: typeof anyErr.stack === 'string' ? anyErr.stack : undefined,
        };
      }
    }

    return { kind, message: String(e ?? 'UNKNOWN') };
  },

  /**
   * Clone CrdtRepoProps.
   */
  clone(p: t.CrdtRepoProps): t.CrdtRepoProps {
    return {
      id: p.id,
      status: { ready: p.status.ready, stalled: p.status.stalled },
      stores: [...p.stores],
      sync: {
        peers: [...p.sync.peers],
        urls: [...p.sync.urls],
        enabled: p.sync.enabled,
      },
    };
  },
} as const;
