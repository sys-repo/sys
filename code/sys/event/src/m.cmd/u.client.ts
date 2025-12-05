import { type t, createId, Rx } from './common.ts';
import { CmdIs } from './m.Is.ts';

// Internal: pending call entry (client side).
type PendingEntry = {
  readonly resolve: (value: unknown) => void;
  readonly reject: (error: unknown) => void;
};

// Internal: handle type for timeout timers.
type TimeoutHandle = ReturnType<typeof setTimeout>;

/**
 * Create a command client bound to the given endpoint.
 */
export function makeClient<
  N extends string,
  P extends t.CmdPayloadMap<N>,
  R extends t.CmdPayloadResultMap<N>,
>(
  endpoint: t.CmdEndpoint,
  opts: { timeout?: t.Msecs; ns?: t.CmdNamespace } = {},
): t.CmdClient<N, P, R> {
  const { timeout, ns } = opts;
  const life = Rx.lifecycle();

  const pending = new Map<t.CmdReqId, PendingEntry>();
  const timers = new Map<t.CmdReqId, TimeoutHandle>();
  const eventHandlers = new Map<t.CmdReqId, Set<(event: unknown) => void>>();

  /**
   * ---------------------------------------------------------------------------
   * Client wire-protocol operations
   *
   *  • onMessage — inbound routing for result + event envelopes.
   *  • send      — unary request/response command.
   *  • stream    — request that opens an event stream until final result.
   *
   * These three form the client-side command lifecycle:
   *    send/stream → pending registry → inbound dispatch → completion/disposal
   * ---------------------------------------------------------------------------
   */

  /**
   * Handles inbound messages and routes them to result or event listeners.
   */
  const onMessage = (event: MessageEvent) => {
    const msg = event.data;

    /** Result envelopes. */
    if (CmdIs.response(msg)) {
      // Ignore responses for other namespaces, if configured.
      if (ns !== undefined && msg.ns !== ns) return;

      const id: t.CmdReqId = msg.id;
      const name: t.CmdName = msg.name;
      const entry = pending.get(id);
      if (!entry) return;

      pending.delete(id);

      const timer = timers.get(id);
      if (timer) {
        clearTimeout(timer);
        timers.delete(id);
      }

      // Drop any event handlers for this request: the stream is now closed.
      eventHandlers.delete(id);

      if (msg.error) {
        const message = msg.error;
        const err = makeError({ kind: 'CmdErrorRemote', message, meta: { name, id, ns } });
        entry.reject(err);
      } else {
        entry.resolve(msg.payload);
      }

      return;
    }

    /** Event envelopes. */
    if (CmdIs.event(msg)) {
      if (ns !== undefined && msg.ns !== ns) return;

      const id: t.CmdReqId = msg.id;
      const handlers = eventHandlers.get(id);
      if (!handlers || handlers.size === 0) return;

      for (const handler of handlers) {
        handler(msg.payload);
      }

      return;
    }

    // Ignore everything else.
  };

  /**
   * Track a pending request and (optionally) arm a timeout for it.
   */
  function registerPendingWithTimeout(id: t.CmdReqId, name: t.CmdName, entry: PendingEntry) {
    pending.set(id, entry);

    if (timeout === undefined) return;

    function onTimeout() {
      timers.delete(id);
      const pendingEntry = pending.get(id);
      if (!pendingEntry) return;

      pending.delete(id);
      eventHandlers.delete(id);

      const error = makeError({
        kind: 'CmdErrorTimeout',
        message: `Command "${name}" timed out after ${timeout}ms.`,
        meta: { name, id, ns },
      });
      pendingEntry.reject(error);
    }

    const handle: TimeoutHandle = setTimeout(onTimeout, timeout);
    timers.set(id, handle);
  }

  /**
   * Sends a unary command and resolves with its result.
   */
  const send: t.CmdClient<N, P, R>['send'] = (name, payload) => {
    const id = createId();
    const envelope: t.CmdEnvelope = { kind: 'cmd', ns, id, name, payload };
    return new Promise<R[typeof name]>((resolve, reject) => {
      const entry: PendingEntry = { resolve: (value) => resolve(value as R[typeof name]), reject };
      registerPendingWithTimeout(id, name, entry);
      endpoint.postMessage(envelope);
    });
  };

  /**
   * Sends a streaming command and returns its event stream handle.
   */
  function stream<K extends N>(name: K, payload: P[K]) {
    const id = createId();
    const envelope: t.CmdEnvelope = { kind: 'cmd', ns, id, name, payload };

    const done = new Promise<R[K]>((resolve, reject) => {
      const entry: PendingEntry = { resolve: (value) => resolve(value as R[K]), reject };
      registerPendingWithTimeout(id, name as t.CmdName, entry);
      endpoint.postMessage(envelope);
    });

    const streamHandle: t.CmdStream<N, R, t.CmdPayloadEventMap<N>, K> = {
      id,
      done,
      dispose() {
        const timer = timers.get(id);
        if (timer) {
          clearTimeout(timer);
          timers.delete(id);
        }

        pending.delete(id);
        eventHandlers.delete(id);
      },
      onEvent(fn) {
        const life = Rx.lifecycle();
        const handler = (event: unknown) => fn(event as t.CmdPayloadEventMap<N>[K]);

        let set = eventHandlers.get(id);
        if (!set) {
          set = new Set();
          eventHandlers.set(id, set);
        }
        set.add(handler);

        life.dispose$.subscribe(() => {
          const set = eventHandlers.get(id);
          if (!set) return;
          set.delete(handler);
          if (set.size === 0) eventHandlers.delete(id);
        });

        return life;
      },
    };

    return streamHandle;
  }

  /**
   * Lifecycle:
   */
  function teardown() {
    endpoint.removeEventListener('message', onMessage);
    for (const handle of timers.values()) {
      clearTimeout(handle);
    }

    const error = makeError({
      kind: 'CmdErrorClientDisposed',
      message: 'Command client disposed before response was received.',
    });
    for (const entry of pending.values()) {
      entry.reject(error);
    }

    pending.clear();
    eventHandlers.clear();
    endpoint.close?.();
  }

  life.dispose$.subscribe(teardown);
  endpoint.addEventListener('message', onMessage);
  endpoint.start?.();

  /**
   * API:
   */
  const client = Rx.toLifecycle<t.CmdClient<N, P, R>>(life, { send, stream });
  return client;
}

/**
 * Helpers:
 */
const makeError = (args: {
  readonly kind: t.CmdErrorKind;
  readonly message: string;
  readonly meta?: t.CmdErrorMeta;
}): t.CmdError => {
  const { kind, message, meta } = args;

  const err = new Error(message) as t.DeepMutable<t.CmdError>;
  err.name = kind;

  if (meta) {
    err.cmd = meta;
    err.ns = meta.ns;
  }

  return err;
};
