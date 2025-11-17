import { type t, Rx, Schedule, Try } from './common.ts';
import { onMessageErrorHandler } from './u.onErrorMessage.ts';
import { Wire } from './u.wire.ts';

/**
 * Attach a real repo instance to a MessagePort.
 * Forwards:
 *   - stream/open
 *   - props/snapshot
 *   - props/change
 *   - network events
 *   - RPC calls (whenReady, create, get, delete, sync.enable)
 */
export const attach: t.CrdtWorkerLib['attach'] = (port, repo) => {
  port.start?.();

  /**
   * Lifecycle:
   * - Tied to the upstream repo; when it disposes we emit stream/close and
   *   close the port.
   */
  const life = Rx.abortable(repo.dispose$);

  const sendResult = (msg: t.WireResult) => port.postMessage(msg);
  const sendEvent = (msg: t.WireEvent) => port.postMessage(msg);
  const sendRepoEvent = (event: t.WireRepoEventPayload) =>
    sendEvent(Wire.event(Wire.Kind.repo, event));

  life.dispose$.subscribe(() => {
    sendRepoEvent({ type: 'stream/close', payload: {} });
    Try.run(() => port.close?.());
  });

  /**
   * Initial handshake:
   *   1. stream/open (immediately)
   *   2. props/snapshot (current repo props)
   *   3. props/snapshot again on next microtask for late listeners
   */
  const sendSnapshot = () =>
    sendRepoEvent({
      type: 'props/snapshot',
      payload: Wire.clone(repo),
    });

  sendRepoEvent({ type: 'stream/open', payload: {} });
  sendSnapshot();
  Schedule.micro(() => {
    if (!repo.disposed) sendSnapshot();
  });

  /**
   * Live event forwarding:
   * - repo.events(life) is the single source of truth.
   * - ready$ is now derived client-side from status changes; we do not emit
   *   a dedicated wire-level ready event anymore.
   */
  const ev = repo.events(life);
  ev.network$.subscribe((e) => sendRepoEvent(e));
  ev.prop$.subscribe((e) => {
    const before = Wire.clone(e.before);
    const after = Wire.clone(e.after);
    sendRepoEvent({
      type: 'props/change',
      payload: { prop: e.prop, before, after },
    });
  });

  /**
   * Send "proof of life" ping.
   */
  Rx.interval(500)
    .pipe(
      Rx.takeUntil(life.dispose$),
      Rx.filter(() => repo.status.ready),
    )
    .subscribe(() => sendRepoEvent({ type: 'stream/ping', payload: {} }));

  /**
   * RPC: client → worker calls on this port.
   *
   * Note:
   * - Domain-level failures should be encoded in result data (e.g. `{ error }`).
   * - Thrown errors here are treated as transport failures and wrapped in WireError.
   */
  type RpcHandler = (...args: readonly unknown[]) => unknown | Promise<unknown>;
  type RpcTable = Partial<Record<t.WireRepoMethod, RpcHandler>>;

  const handlers: RpcTable = {
    async whenReady() {
      await repo.whenReady();
    },

    'sync.enable'(enabled?: unknown) {
      repo.sync.enable(enabled as boolean | undefined);
    },

    create(initial: unknown) {
      const doc = repo.create(initial as Record<string, unknown>);
      return { id: doc.id } as t.WireRepoCreateResult;
    },

    async get(id: unknown, options?: unknown) {
      const { doc, error } = await repo.get(id as t.StringId, options as t.CrdtRepoGetOptions);
      const data: t.WireRepoGetResult = doc ? { doc: { id: doc.id } } : error ? { error } : {};
      return data;
    },

    delete(id: unknown) {
      return repo.delete(id as t.StringId);
    },
  };

  const onMessage = (event: MessageEvent) => {
    const msg = event.data as t.WireMessage | undefined;
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
      .then((data) => sendResult(Wire.ok(id, data as t.WireRepoResultData[t.WireRepoMethod])))
      .catch((error) => sendResult(Wire.err(id, Wire.errFrom(error))));
  };

  port.addEventListener?.('message', onMessage, { signal: life.signal });

  /**
   * Safety:
   * - Handle "messageerror" (structured clone failures etc) via the shared helper.
   */
  onMessageErrorHandler(port, repo, sendEvent, life);
};
