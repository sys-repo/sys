import { type t, Rx } from './common.ts';

/**
 * Create a typed command-bus instance for a concrete command set.
 */
export function make<
  N extends string = t.CmdName,
  P extends t.CmdPayloadMap<N> = t.CmdPayloadMap<N>,
  R extends t.CmdPayloadResultMap<N> = t.CmdPayloadResultMap<N>,
>(): t.CmdInstance<N, P, R> {
  return {
    client: (endpoint) => createClient<N, P, R>(endpoint),
    host: (endpoint, handlers) => createHost<N, P, R>(endpoint, handlers),
  };
}

/**
 * Internal: pending call entry (client side).
 */
type PendingEntry = {
  readonly resolve: (value: unknown) => void;
  readonly reject: (error: unknown) => void;
};

/**
 * Create a command client bound to the given endpoint.
 */
function createClient<
  N extends string,
  P extends t.CmdPayloadMap<N>,
  R extends t.CmdPayloadResultMap<N>,
>(endpoint: t.CmdEndpoint): t.CmdClient<N, P, R> {
  const life = Rx.lifecycle();
  const pending = new Map<string, PendingEntry>();

  const onMessage = (event: MessageEvent) => {
    const msg = event.data;
    if (!isCmdResultEnvelope(msg)) return;

    const entry = pending.get(msg.id);
    if (!entry) return;

    pending.delete(msg.id);

    if (msg.error) {
      entry.reject(new Error(msg.error));
    } else {
      entry.resolve(msg.payload);
    }
  };

  endpoint.addEventListener('message', onMessage);
  endpoint.start?.();

  const send: t.CmdClient<N, P, R>['send'] = (name, payload) => {
    const id = createId();
    const envelope: t.CmdEnvelope = {
      kind: 'cmd',
      id,
      name: name as t.CmdName,
      payload,
    };

    return new Promise<R[typeof name]>((resolve, reject) => {
      const entry: PendingEntry = {
        // Wrap to satisfy (unknown) → R[K] variance safely.
        resolve: (value) => resolve(value as R[typeof name]),
        reject,
      };
      pending.set(id, entry);
      endpoint.postMessage(envelope);
    });
  };

  life.dispose$.subscribe(() => {
    endpoint.removeEventListener('message', onMessage);
    const error = new Error('Command client disposed before response was received.');
    for (const entry of pending.values()) {
      entry.reject(error);
    }
    pending.clear();
  });

  /**
   * API:
   */
  const client = Rx.toLifecycle<t.CmdClient<N, P, R>>(life, { send });
  return client;
}

/**
 * Create a command host bound to the given endpoint.
 */
function createHost<
  N extends string,
  P extends t.CmdPayloadMap<N>,
  R extends t.CmdPayloadResultMap<N>,
>(endpoint: t.CmdEndpoint, handlers: t.CmdHandlers<N, P, R>): t.CmdHost {
  const life = Rx.abortable();

  const onMessage = async (event: MessageEvent) => {
    const msg = event.data;
    if (!isCmdEnvelope(msg)) return;

    const { id, name, payload } = msg;

    const handler = handlers[name as N];
    let resultPayload: unknown;
    let error: string | undefined;

    try {
      if (!handler) throw new Error(`No handler registered for command "${name}".`);
      resultPayload = await handler(payload as P[N]);
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
    }

    const envelope: t.CmdResultEnvelope = {
      kind: 'cmd:result',
      id,
      name,
      payload: resultPayload,
      error,
    };

    endpoint.postMessage(envelope);
  };

  endpoint.addEventListener('message', onMessage);
  life.dispose$.subscribe(() => endpoint.removeEventListener('message', onMessage));
  endpoint.start?.();

  /**
   * API:
   */
  const host = Rx.toLifecycle<t.CmdHost>(life, {});
  return host;
}

/**
 * Runtime type guards for wire envelopes.
 */
function isCmdEnvelope(input: unknown): input is t.CmdEnvelope {
  const msg = input as t.CmdEnvelope | undefined;
  return !!msg && msg.kind === 'cmd' && typeof msg.id === 'string' && typeof msg.name === 'string';
}

function isCmdResultEnvelope(input: unknown): input is t.CmdResultEnvelope {
  const msg = input as t.CmdResultEnvelope | undefined;
  return (
    !!msg && msg.kind === 'cmd:result' && typeof msg.id === 'string' && typeof msg.name === 'string'
  );
}

/**
 * Simple id generator: use crypto.randomUUID if available, otherwise a monotonic counter.
 */
let idCounter = 0;

function createId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  idCounter += 1;
  return `cmd-${idCounter}`;
}
