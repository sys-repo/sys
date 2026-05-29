import { Rx, Time, type t } from './common.ts';
import { CmdIs } from './m.Is.ts';
import { createId } from './u.id.ts';
import { sameNamespace } from './u.namespace.ts';

type ClientRuntimeOptions = t.Cmd.Client.Options & {
  readonly ns?: t.Cmd.Namespace;
};

// Internal: pending call entry (client side).
type PendingEntry = {
  readonly name: t.Cmd.Name;
  readonly resolve: (value: unknown) => void;
  readonly reject: (error: unknown) => void;
};

// Internal: handle type for timeout timers.
type TimeoutHandle = t.Time.Delay.Promise;

type StreamTerminal =
  | { readonly ok: true }
  | { readonly ok: false; readonly error: unknown };

type StreamTerminalHandler = (terminal: StreamTerminal) => void;

/**
 * Create a command client bound to the given endpoint.
 */
export function makeClient<
  N extends string,
  P extends t.Cmd.Payload.Map<N>,
  R extends t.Cmd.Result.Map<N>,
  E extends t.Cmd.Event.Map<N> = t.Cmd.Event.Map<N>,
>(
  endpoint: t.Cmd.Endpoint,
  opts: ClientRuntimeOptions = {},
): t.Cmd.Client.Handle<N, P, R, E> {
  const { timeout, ns, closeEndpoint = false } = opts;
  const life = Rx.lifecycle();

  const pending = new Map<t.Cmd.ReqId, PendingEntry>();
  const timers = new Map<t.Cmd.ReqId, TimeoutHandle>();
  const eventHandlers = new Map<t.Cmd.ReqId, Set<(event: unknown) => void>>();
  const eventSubscriptions = new Map<t.Cmd.ReqId, Set<t.Lifecycle>>();
  const terminalHandlers = new Map<t.Cmd.ReqId, Set<StreamTerminalHandler>>();

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
          kind: 'CmdError.Remote',
          message:
            `Command response name mismatch: expected "${entry.name}", received "${msg.name}".`,
          meta: { name: entry.name, id: msg.id, ns },
        });
        rejectPending(msg.id, error);
        return;
      }

      if (msg.error !== undefined) {
        const error = makeError({
          kind: 'CmdError.Remote',
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
  function registerPendingWithTimeout(id: t.Cmd.ReqId, name: t.Cmd.Name, entry: PendingEntry) {
    pending.set(id, entry);

    if (timeout === undefined) return;

    function onTimeout() {
      const pendingEntry = pending.get(id);
      if (!pendingEntry) return;

      const error = makeError({
        kind: 'CmdError.Timeout',
        message: `Command "${name}" timed out after ${timeout}ms.`,
        meta: { name, id, ns },
      });
      cancelPending(id, error, 'timeout');
    }

    const handle: TimeoutHandle = Time.delay(timeout, onTimeout);
    timers.set(id, handle);
  }

  /**
   * Sends a unary command and resolves with its result.
   */
  const send = <K extends N>(name: K, payload: P[K]): Promise<R[K]> => {
    const id = createId();
    if (life.disposed) return Promise.reject(makeClientDisposedError(name, id));

    const envelope: t.Cmd.Wire.Request = { kind: 'cmd', ns, id, name, payload };
    const done = new Promise<R[K]>((resolve, reject) => {
      const entry: PendingEntry = {
        name,
        resolve: (value) => resolve(value as R[K]),
        reject,
      };
      registerPendingWithTimeout(id, name, entry);
    });

    postRequest(id, envelope);
    return done;
  };

  /**
   * Sends a streaming command and returns its event stream handle.
   */
  function stream<K extends N>(name: K, payload: P[K]): t.Cmd.Stream.Handle<N, R, E, K> {
    const id = createId();
    if (life.disposed) return closedStream<K>(id, makeClientDisposedError(name, id));

    const envelope: t.Cmd.Wire.Request = { kind: 'cmd', ns, id, name, payload };
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
        kind: 'CmdError.Cancelled',
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
      addEventSubscription(id, life);

      life.dispose$.subscribe(() => {
        removeEventHandler(id, handler);
        removeEventSubscription(id, life);
      });
      return life;
    };

    const streamHandle: t.Cmd.Stream.Handle<N, R, E, K> = {
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
      kind: 'CmdError.ClientDisposed',
      message: 'Command client disposed before response was received.',
    });

    for (const [id, entry] of entries) {
      postCancel(id, entry.name, 'client-dispose');
      rejectPending(id, error);
    }

    for (const handle of timers.values()) {
      handle.cancel();
    }
    timers.clear();
    pending.clear();
    eventHandlers.clear();
    eventSubscriptions.clear();
    terminalHandlers.clear();

    if (closeEndpoint) endpoint.close?.();
  }

  life.dispose$.subscribe(teardown);
  endpoint.addEventListener('message', onMessage);
  endpoint.start?.();

  /**
   * API:
   */
  return Rx.toLifecycle<t.Cmd.Client.Handle<N, P, R, E>>(life, { send, stream });

  /**
   * Helpers:
   */
  function closedStream<K extends N>(
    id: t.Cmd.ReqId,
    error: t.Cmd.Error.Instance,
  ): t.Cmd.Stream.Handle<N, R, E, K> {
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

  function makeClientDisposedError(name: t.Cmd.Name, id: t.Cmd.ReqId) {
    return makeError({
      kind: 'CmdError.ClientDisposed',
      message: `Command "${name}" was not sent because the client is disposed.`,
      meta: { name, id, ns },
    });
  }

  function postRequest(id: t.Cmd.ReqId, envelope: t.Cmd.Wire.Request) {
    try {
      endpoint.postMessage(envelope);
    } catch (err) {
      rejectPending(id, err);
    }
  }

  function postCancel(id: t.Cmd.ReqId, name: t.Cmd.Name, reason: string) {
    const envelope: t.Cmd.Wire.Cancel = { kind: 'cmd:cancel', ns, id, name, reason };
    try {
      endpoint.postMessage(envelope);
    } catch {
      // Cancellation is best-effort once the transport is already failing/closing.
    }
  }

  function cancelPending(id: t.Cmd.ReqId, error: unknown, reason: string) {
    const entry = pending.get(id);
    if (!entry) return;

    postCancel(id, entry.name, reason);
    rejectPending(id, error);
  }

  function resolvePending(id: t.Cmd.ReqId, payload: unknown) {
    const entry = pending.get(id);
    if (!entry) return;

    cleanupPending(id, { ok: true });
    entry.resolve(payload);
  }

  function rejectPending(id: t.Cmd.ReqId, error: unknown) {
    const entry = pending.get(id);
    if (!entry) return;

    cleanupPending(id, { ok: false, error });
    entry.reject(error);
  }

  function cleanupPending(id: t.Cmd.ReqId, terminal: StreamTerminal) {
    pending.delete(id);
    clearTimer(id);
    disposeEventSubscriptions(id);
    eventHandlers.delete(id);
    notifyTerminal(id, terminal);
  }

  function clearTimer(id: t.Cmd.ReqId) {
    const timer = timers.get(id);
    if (!timer) return;

    timer.cancel();
    timers.delete(id);
  }

  function addEventHandler(id: t.Cmd.ReqId, handler: (event: unknown) => void) {
    let handlers = eventHandlers.get(id);
    if (!handlers) {
      handlers = new Set();
      eventHandlers.set(id, handlers);
    }
    handlers.add(handler);
  }

  function removeEventHandler(id: t.Cmd.ReqId, handler: (event: unknown) => void) {
    const handlers = eventHandlers.get(id);
    if (!handlers) return;

    handlers.delete(handler);
    if (handlers.size === 0) eventHandlers.delete(id);
  }

  function addEventSubscription(id: t.Cmd.ReqId, subscription: t.Lifecycle) {
    let subscriptions = eventSubscriptions.get(id);
    if (!subscriptions) {
      subscriptions = new Set();
      eventSubscriptions.set(id, subscriptions);
    }
    subscriptions.add(subscription);
  }

  function removeEventSubscription(id: t.Cmd.ReqId, subscription: t.Lifecycle) {
    const subscriptions = eventSubscriptions.get(id);
    if (!subscriptions) return;

    subscriptions.delete(subscription);
    if (subscriptions.size === 0) eventSubscriptions.delete(id);
  }

  function disposeEventSubscriptions(id: t.Cmd.ReqId) {
    const subscriptions = eventSubscriptions.get(id);
    eventSubscriptions.delete(id);
    if (!subscriptions) return;

    for (const subscription of subscriptions) {
      subscription.dispose();
    }
  }

  function addTerminalHandler(id: t.Cmd.ReqId, handler: StreamTerminalHandler) {
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

  function notifyTerminal(id: t.Cmd.ReqId, terminal: StreamTerminal) {
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
  readonly id: t.Cmd.ReqId;
  readonly onEvent: (fn: (event: T) => void) => t.Lifecycle;
  readonly dispose: () => void;
  readonly terminal: () => StreamTerminal | undefined;
  readonly addTerminalHandler: (
    id: t.Cmd.ReqId,
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

const makeError = (args: {
  readonly kind: t.Cmd.Error.Kind;
  readonly message: string;
  readonly meta?: t.Cmd.Error.Meta;
}): t.Cmd.Error.Instance => {
  const { kind, message, meta } = args;

  const err = new Error(message) as t.DeepMutable<t.Cmd.Error.Instance>;
  err.name = kind;

  if (meta) {
    err.cmd = meta;
    err.ns = meta.ns;
  }

  return err;
};
