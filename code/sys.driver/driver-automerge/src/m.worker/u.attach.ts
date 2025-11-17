import { type t, Rx, Schedule, Try } from './common.ts';
import { onMessageErrorHandler } from './u.onErrorMessage.ts';
import { Wire } from './u.wire.ts';

/**
 * Attach a real repo instance to a port.
 * Forward:
 *   - stream/open
 *   - ready events
 *   - props/snapshot
 *   - props/change
 *   - network events
 *   - RPC calls
 */
export const attach: t.CrdtWorkerLib['attach'] = (port, repo) => {
  const life = Rx.abortable(repo.dispose$);
  port.start?.();

  const sendResult = (e: t.WireResult) => port.postMessage(e);
  const sendEvent = (e: t.WireEvent) => port.postMessage(e);
  const sendRepoEvent = (e: t.WireRepoEventPayload) => sendEvent(Wire.event(Wire.Kind.repo, e));

  life.dispose$.subscribe(() => {
    sendRepoEvent({ type: 'stream/close', payload: {} });
    Try.run(() => port.close?.());
  });

  /**
   * Initial handshake:
   */

  // 1. stream/open immediately
  sendRepoEvent({ type: 'stream/open', payload: {} });

  // 2. "ready: false" ALWAYS first
  sendRepoEvent({ type: 'ready', payload: { ready: false } });

  // 3. initial snapshot
  sendRepoEvent({ type: 'props/snapshot', payload: Wire.clone(repo) });

  // 4. microtask: final "real" ready + second snapshot
  Schedule.micro(() => {
    if (repo.disposed) return;
    sendRepoEvent({ type: 'ready', payload: { ready: repo.status.ready } });
    sendRepoEvent({ type: 'props/snapshot', payload: Wire.clone(repo) });
  });

  /**
   * Live event forwarding:
   */
  const ev = repo.events(life);
  ev.ready$.subscribe((ready) => sendRepoEvent({ type: 'ready', payload: { ready } }));
  ev.network$.subscribe((e) => sendRepoEvent(e));
  ev.prop$.subscribe((e) => {
    const before = Wire.clone(e.before);
    const after = Wire.clone(e.after);
    sendRepoEvent({ type: 'props/change', payload: { prop: e.prop, before, after } });
  });

  /**
   * RPC (Remote Procedure Calls):
   */
  const handlers: Partial<Record<t.WireRepoMethod, (...args: unknown[]) => unknown>> = {
    async whenReady() {
      await repo.whenReady();
      return;
    },
    'sync.enable'(enabled?: unknown) {
      repo.sync.enable(enabled as boolean | undefined);
      return;
    },
    create(initial: unknown) {
      const doc = repo.create(initial as Record<string, unknown>);
      return { id: doc.id as t.StringId };
    },
    get(id: unknown, opts?: unknown) {
      return repo.get(id as t.StringId, opts as t.CrdtRepoGetOptions | undefined);
    },
    delete(id: unknown) {
      return repo.delete(id as t.StringId);
    },
  };

  port.addEventListener?.(
    'message',
    (ev: MessageEvent) => {
      const msg = ev.data as t.WireMessage | undefined;
      if (!msg || msg.type !== 'call') return;

      const fn = handlers[msg.method];
      if (!fn) {
        const error = Wire.errFrom(`Unknown RPC method: ${msg.method}`, 'NotImplemented');
        sendResult(Wire.err(msg.id, error));
        return;
      }

      Promise.resolve()
        .then(() => fn(...(msg.args as unknown[])))
        .then((data) => sendResult(Wire.ok(msg.id, data as any)))
        .catch((err) => sendResult(Wire.err(msg.id, Wire.errFrom(err))));
    },
    { signal: life.signal },
  );

  onMessageErrorHandler(port, repo, sendEvent, life);
};
