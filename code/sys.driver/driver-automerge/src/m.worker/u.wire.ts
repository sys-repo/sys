import { type t, WIRE_VERSION } from './common.ts';

/**
 * Simple factories for well-formed messages.
 */
export const Wire = {
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

  ok(id: t.WireId, data: unknown): t.WireResult {
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

  Stream: {
    repo: 'crdt:repo' as const,
    doc: (id: t.StringId) => `crdt:doc:${id}` as const,
    isDoc: (s: t.WireStream): s is `crdt:doc:${string}` => s.startsWith('crdt:doc:'),
  },
} as const;
