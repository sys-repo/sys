import { type t, Rx } from './common.ts';
import { CmdIs } from './m.Is.ts';
import { createId } from './u.id.ts';

type ClientRuntimeOptions = t.CmdClientOptions & {
  readonly ns?: t.CmdNamespace;
};

// Internal: pending call entry (client side).
type PendingEntry = {
  readonly name: t.CmdName;
  readonly resolve: (value: unknown) => void;
  readonly reject: (error: unknown) => void;
};

// Internal: handle type for timeout timers.
type TimeoutHandle = ReturnType<typeof setTimeout>;

type StreamTerminal =
  | { readonly ok: true }
  | { readonly ok: false; readonly error: unknown };

type StreamTerminalHandler = (terminal: StreamTerminal) => void;

/**
 * Create a command client bound to the given endpoint.
 */
export function makeClient<
  N extends string,
  P extends t.CmdPayloadMap<N>,
  R extends t.CmdPayloadResultMap<N>,
  E extends t.CmdPayloadEventMap<N> = t.CmdPayloadEventMap<N>,
>(
  endpoint: t.CmdEndpoint,
  opts: ClientRuntimeOptions = {},
): t.CmdClient<N, P, R, E> {
  const { timeout, ns, closeEndpoint = false } = opts;
  const life = Rx.lifecycle();

  const pending = new Map<t.CmdReqId, PendingEntry>();
  const timers = new Map<t.CmdReqId, TimeoutHandle>();
  const eventHandlers = new Map<t.CmdReqId, Set<(event: unknown) => void>>();
  const terminalHandlers = new Map<t.CmdReqId, Set<StreamTerminalHandler>>();

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
      if (!sameNamespace(msg.ns, ns)) return;

      const entry = pending.get(msg.id);
      if (!entry) return;

      if (entry.name !== msg.name) {
        const error = makeError({
          kind: 'CmdErrorRemote',
          message: `Command response name mismatch: expected "${entry.name}", received "${msg.name}".`,
          meta: { name: entry.name, id: msg.id, ns },
        });
        rejectPending(msg.id, error);
        return;
      }

      if (msg.error !== undefined) {
        const error = makeError({
          kind: 'CmdErrorRemote',
          message: msg.error,
          meta: { name: msg.name, id: msg.id, ns },
        });
        rejectPending(msg.id, error);
      } else {
        resolvePending(msg.id, msg.payload);
      }

      return;
    }

    /** Event envelopes. */
    if (CmdIs.event(msg)) {
      if (!sameNamespace(msg.ns, ns)) return;

      const entry = pending.get(msg.id);
      if (!entry || entry.name !== msg.name) return;

      const handlers = eventHandlers.get(msg.id);
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
      const pendingEntry = pending.get(id);
      if (!pendingEntry) return;

      const error = makeError({
        kind: 'CmdErrorTimeout',
        message: `Command "${name}" timed out after ${timeout}ms.`,
        meta: { name, id, ns },
      });
      cancelPending(id, error, 'timeout');
    }

    const handle: TimeoutHandle = setTimeout(onTimeout, timeout);
    timers.set(id, handle);
  }

  /**
   * Sends a unary command and resolves with its result.
   */
  const send: t.CmdClient<N, P, R, E>['send'] = (name, payload) => {
    const id = createId();
    if (life.disposed) return Promise.reject(makeClientDisposedError(name, id));

    const envelope: t.CmdEnvelope = { kind: 'cmd', ns, id, name, payload };
    const done = new Promise<R[typeof name]>((resolve, reject) => {
      const entry: PendingEntry = { name, resolve: (value) => resolve(value as R[typeof name]), reject };
      registerPendingWithTimeout(id, name, entry);
    });

    postRequest(id, envelope);
    return done;
  };

  /**
   * Sends a streaming command and returns its event stream handle.
   */
  function stream<K extends N>(name: K, payload: P[K]): t.CmdStream<N, R, E, K> {
    const id = createId();
    if (life.disposed) return closedStream<K>(id, makeClientDisposedError(name, id));

    const envelope: t.CmdEnvelope = { kind: 'cmd', ns, id, name, payload };
    let terminal: StreamTerminal | undefined;

    addTerminalHandler(id, (next) => {
      terminal = next;
    });

    const done = new Promise<R[K]>((resolve, reject) => {
      const entry: PendingEntry = { name, resolve: (value) => resolve(value as R[K]), reject };
      registerPendingWithTimeout(id, name, entry);
    });

    const dispose = () => {
      if (terminal) return;

      const error = makeError({
        kind: 'CmdErrorCancelled',
        message: `Command "${name}" was cancelled.`,
        meta: { name, id, ns },
      });
      cancelPending(id, error, 'stream-dispose');
    };

    const onEvent = (fn: (event: E[K]) => void) => {
      const life = Rx.lifecycle();
      if (terminal) {
        life.dispose();
        return life;
      }

      const handler = (event: unknown) => fn(event as E[K]);
      addEventHandler(id, handler);

      life.dispose$.subscribe(() => removeEventHandler(id, handler));
      return life;
    };

    const streamHandle: t.CmdStream<N, R, E, K> = {
      id,
      done,
      dispose,
      onEvent,
      [Symbol.asyncIterator]() {
        return createAsyncIterator<E[K]>({
          id,
          onEvent,
          dispose,
          terminal: () => terminal,
          addTerminalHandler,
        });
      },
    };

    queueMicrotask(() => {
      if (pending.has(id)) postRequest(id, envelope);
    });
    return streamHandle;
  }

  /**
   * Lifecycle:
   */
  function teardown() {
    endpoint.removeEventListener('message', onMessage);

    const entries = Array.from(pending.entries());
    const error = makeError({
      kind: 'CmdErrorClientDisposed',
      message: 'Command client disposed before response was received.',
    });

    for (const [id, entry] of entries) {
      postCancel(id, entry.name, 'client-dispose');
      rejectPending(id, error);
    }

    for (const handle of timers.values()) {
      clearTimeout(handle);
    }
    timers.clear();
    pending.clear();
    eventHandlers.clear();
    terminalHandlers.clear();

    if (closeEndpoint) endpoint.close?.();
  }

  life.dispose$.subscribe(teardown);
  endpoint.addEventListener('message', onMessage);
  endpoint.start?.();

  /**
   * API:
   */
  return Rx.toLifecycle<t.CmdClient<N, P, R, E>>(life, { send, stream });

  /**
   * Helpers:
   */
  function closedStream<K extends N>(id: t.CmdReqId, error: t.CmdError): t.CmdStream<N, R, E, K> {
    const done = Promise.reject(error) as Promise<R[K]>;
    const terminal: StreamTerminal = { ok: false, error };

    return {
      id,
      done,
      dispose() {},
      onEvent() {
        const life = Rx.lifecycle();
        life.dispose();
        return life;
      },
      [Symbol.asyncIterator]() {
        return createClosedAsyncIterator<E[K]>(terminal);
      },
    };
  }

  function makeClientDisposedError(name: t.CmdName, id: t.CmdReqId) {
    return makeError({
      kind: 'CmdErrorClientDisposed',
      message: `Command "${name}" was not sent because the client is disposed.`,
      meta: { name, id, ns },
    });
  }

  function postRequest(id: t.CmdReqId, envelope: t.CmdEnvelope) {
    try {
      endpoint.postMessage(envelope);
    } catch (err) {
      rejectPending(id, err);
    }
  }

  function postCancel(id: t.CmdReqId, name: t.CmdName, reason: string) {
    const envelope: t.CmdCancelEnvelope = { kind: 'cmd:cancel', ns, id, name, reason };
    try {
      endpoint.postMessage(envelope);
    } catch {
      // Cancellation is best-effort once the transport is already failing/closing.
    }
  }

  function cancelPending(id: t.CmdReqId, error: unknown, reason: string) {
    const entry = pending.get(id);
    if (!entry) return;

    postCancel(id, entry.name, reason);
    rejectPending(id, error);
  }

  function resolvePending(id: t.CmdReqId, payload: unknown) {
    const entry = pending.get(id);
    if (!entry) return;

    cleanupPending(id, { ok: true });
    entry.resolve(payload);
  }

  function rejectPending(id: t.CmdReqId, error: unknown) {
    const entry = pending.get(id);
    if (!entry) return;

    cleanupPending(id, { ok: false, error });
    entry.reject(error);
  }

  function cleanupPending(id: t.CmdReqId, terminal: StreamTerminal) {
    pending.delete(id);
    clearTimer(id);
    eventHandlers.delete(id);
    notifyTerminal(id, terminal);
  }

  function clearTimer(id: t.CmdReqId) {
    const timer = timers.get(id);
    if (!timer) return;

    clearTimeout(timer);
    timers.delete(id);
  }

  function addEventHandler(id: t.CmdReqId, handler: (event: unknown) => void) {
    let handlers = eventHandlers.get(id);
    if (!handlers) {
      handlers = new Set();
      eventHandlers.set(id, handlers);
    }
    handlers.add(handler);
  }

  function removeEventHandler(id: t.CmdReqId, handler: (event: unknown) => void) {
    const handlers = eventHandlers.get(id);
    if (!handlers) return;

    handlers.delete(handler);
    if (handlers.size === 0) eventHandlers.delete(id);
  }

  function addTerminalHandler(id: t.CmdReqId, handler: StreamTerminalHandler) {
    let handlers = terminalHandlers.get(id);
    if (!handlers) {
      handlers = new Set();
      terminalHandlers.set(id, handlers);
    }
    handlers.add(handler);

    return () => {
      const handlers = terminalHandlers.get(id);
      if (!handlers) return;

      handlers.delete(handler);
      if (handlers.size === 0) terminalHandlers.delete(id);
    };
  }

  function notifyTerminal(id: t.CmdReqId, terminal: StreamTerminal) {
    const handlers = terminalHandlers.get(id);
    terminalHandlers.delete(id);
    if (!handlers) return;

    for (const handler of handlers) {
      handler(terminal);
    }
  }
}

/**
 * Helpers:
 */
function createClosedAsyncIterator<T>(terminal: StreamTerminal): AsyncIterator<T> {
  return {
    next: () => (terminal.ok ? done<T>() : Promise.reject(terminal.error)),
    return: () => done<T>(),
    throw: (error?: unknown) => Promise.reject(error),
  };
}

function createAsyncIterator<T>(args: {
  readonly id: t.CmdReqId;
  readonly onEvent: (fn: (event: T) => void) => t.Lifecycle;
  readonly dispose: () => void;
  readonly terminal: () => StreamTerminal | undefined;
  readonly addTerminalHandler: (
    id: t.CmdReqId,
    handler: StreamTerminalHandler,
  ) => () => void;
}): AsyncIterator<T> {
  const queue: T[] = [];
  let closed: StreamTerminal | undefined;
  let pendingNext: {
    readonly resolve: (result: IteratorResult<T>) => void;
    readonly reject: (error: unknown) => void;
  } | undefined;

  const subscription = args.onEvent((event) => {
    if (closed) return;

    if (pendingNext) {
      const next = pendingNext;
      pendingNext = undefined;
      next.resolve({ done: false, value: event });
    } else {
      queue.push(event);
    }
  });

  const removeTerminalHandler = args.addTerminalHandler(args.id, finish);
  const terminal = args.terminal();
  if (terminal) finish(terminal);

  return {
    next() {
      if (queue.length > 0) {
        const value = queue.shift() as T;
        return Promise.resolve({ done: false, value });
      }

      if (closed) return closed.ok ? done<T>() : Promise.reject(closed.error);

      return new Promise<IteratorResult<T>>((resolve, reject) => {
        pendingNext = { resolve, reject };
      });
    },

    return() {
      if (!closed) finish({ ok: true });
      args.dispose();
      return done<T>();
    },

    throw(error?: unknown) {
      if (!closed) finish({ ok: false, error });
      args.dispose();
      return Promise.reject(error);
    },
  };

  function finish(terminal: StreamTerminal) {
    if (closed) return;

    closed = terminal;
    subscription.dispose();
    removeTerminalHandler();

    if (!pendingNext) return;

    const next = pendingNext;
    pendingNext = undefined;
    if (terminal.ok) next.resolve({ done: true, value: undefined });
    else next.reject(terminal.error);
  }
}

function done<T>() {
  return Promise.resolve<IteratorResult<T>>({ done: true, value: undefined });
}

function sameNamespace(a: t.CmdNamespace | undefined, b: t.CmdNamespace | undefined) {
  return a === b;
}

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
