import { type t, Rx, Schedule, Try } from './common.ts';
import { Wire } from './u.wire.ts';
import { onMessageErrorHandler } from './u.onErrorMessage.ts';

/**
 * Attaches a real repo instance to a `MessagePort` inside the worker.
 * Forwards repo lifecycle and event streams over the port using wire-safe payloads.
 */
export const attach: t.CrdtWorkerLib['attach'] = (port, repo) => {
  port.start?.();

  const sendResult = (e: t.WireResult) => port.postMessage(e);
  const sendEvent = (e: t.WireEvent) => port.postMessage(e);
  const sendRepoEvent = (e: t.WireRepoEventPayload) => sendEvent(Wire.event(Wire.Kind.repo, e));

  /**
   * Lifecycle:
   */
  const life = Rx.abortable(repo.dispose$);
  life.dispose$.subscribe(() => {
    sendRepoEvent({ type: 'stream/close', payload: {} });
    Try.catch(() => port.close?.());
  });

  /**
   * Open stream; emit initial readiness snapshots.
   */
  const sendReady = () => sendRepoEvent({ type: 'ready', payload: { ready: repo.ready } });
  const sendSnapshot = () => sendRepoEvent({ type: 'props/snapshot', payload: Wire.clone(repo) });

  // Send immediately for early listeners...
  sendRepoEvent({ type: 'stream/open', payload: {} });
  sendReady();
  sendSnapshot();
  // ...and again next microtask for late listeners.
  Schedule.micro(() => {
    sendReady();
    sendSnapshot();
  });

  /**
   * Live event forwarding:
   */
  const ev = repo.events(life);

  // Forward continuous ready$ updates:
  ev.ready$.subscribe((ready) => sendRepoEvent({ type: 'ready', payload: { ready } }));

  // Forward continuous prop$ updates:
  ev.prop$.subscribe((e) => {
    sendRepoEvent({
      type: 'props/change',
      payload: {
        prop: e.prop,
        before: Wire.clone(e.before),
        after: Wire.clone(e.after),
      },
    });
  });

  // Network events are already discriminated data payloads; forward as-is:
  ev.network$.subscribe((payload) => sendRepoEvent(payload));

  /**
   * RPC: handle client → worker calls on this port.
   */
  type RpcHandler = (...args: unknown[]) => unknown | Promise<unknown>;
  type RpcHandlerTable = Partial<Record<t.WireRepoMethod, RpcHandler>>;
  const handlers: RpcHandlerTable = {
    'sync.enable': (enabled?: unknown) => repo.sync.enable(enabled as boolean | undefined),
  };

  const onMessage = (ev: MessageEvent) => {
    const msg = ev.data as t.WireMessage | undefined;
    if (!msg || msg.type !== 'call') return;

    const { id, method, args } = msg;
    const handler = handlers[method];
    if (!handler) {
      const error = Wire.errFrom(`Unknown RPC method: ${method}`, 'NotImplemented');
      sendResult(Wire.err(id, error));
      return;
    }

    Promise.resolve()
      .then(() => handler(...(args as unknown[])))
      .then((data) => sendResult(Wire.ok(id, data)))
      .catch((error) => sendResult(Wire.err(id, Wire.errFrom(error))));
  };

  port.addEventListener?.('message', onMessage, { signal: life.signal });

  /**
   * Safety:
   *   If the port encounters "messageerror" (eg. structured clone failures),
   *   emit a diagnostic and close after repeated faults.
   */
  onMessageErrorHandler(port, repo, sendEvent, life);
};
