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
    networkEvent(e: t.WireRepoEventPayload): e is t.CrdtNetworkChangeEvent {
      return (
        e.type === 'network/peer-online' ||
        e.type === 'network/peer-offline' ||
        e.type === 'network/close'
      );
    },

    /** True when event is a transport-only lifecycle signal. */
    streamLifecycle(
      e: t.WireRepoEventPayload,
    ): e is
      | { type: 'stream/open'; payload: {} }
      | { type: 'stream/close'; payload: {} }
      | { type: 'stream/error'; payload: { message?: string } } {
      return e.type === 'stream/open' || e.type === 'stream/close' || e.type === 'stream/error';
    },

    /** True when the event is a CRDT repo API event (not a wire lifecycle signal). */
    repoEvent(e: t.WireRepoEventPayload): e is t.CrdtRepoEvent {
      return (
        e.type === 'ready' ||
        e.type === 'props/snapshot' ||
        e.type === 'props/change' ||
        Wire.Is.networkEvent(e)
      );
    },
  },

  call<M extends t.WireRepoMethod>(
    id: t.WireId,
    method: M,
    ...args: t.WireRepoArgs[M]
  ): t.WireCall<M> {
    return { version: WIRE_VERSION, type: 'call', id, method, args };
  },

  event(stream: t.WireStream, event: t.WireRepoEventPayload): t.WireEvent {
    return { version: WIRE_VERSION, type: 'event', stream, event };
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

  clone(p: t.CrdtRepoProps): t.CrdtRepoProps {
    return {
      id: p.id,
      ready: p.ready,
      status: {
        ready: p.status.ready,
        busy: p.status.busy,
        stalled: p.status.stalled,
      },
      sync: {
        peers: [...p.sync.peers],
        urls: [...p.sync.urls],
        enabled: p.sync.enabled,
      },
      stores: [...p.stores],
    };
  },
} as const;
