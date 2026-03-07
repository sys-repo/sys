import { type t, Rx, Schedule, Try } from './common.ts';
import { attachDoc } from '../m.worker/u.host.attach.doc.ts';
import { onMessageErrorHandler } from '../m.worker/u.wire.onErrorMessage.ts';
import { Wire } from '../m.worker/u.wire.ts';
import { createHandlers } from './u.host.handlers.ts';
import { make } from './u.make.ts';

type O = Record<string, unknown>;

/**
 * Attach a real repo instance to a MessagePort using Cmd-based RPC.
 *
 * Hybrid approach:
 * - RPC operations via Cmd system (repo:ready, repo:create, etc.)
 * - High-frequency events stay as direct postMessage for performance
 *   (props/snapshot, props/change, network events, doc events)
 */
export const attach: t.CrdtWorkerCmdHostLib['attach'] = (port, repo) => {
  port.start?.();

  /**
   * Lifecycle:
   * - Tied to the upstream repo; when it disposes we emit stream/close and
   *   close the port.
   */
  const life = Rx.abortable(repo.dispose$);

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
   * - ready$ is now derived client-side from status changes.
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
   * Cmd-based RPC handlers.
   *
   * The handlers execute repo operations and return results via Cmd protocol.
   * Doc attachment for streaming is handled via the onGetDoc callback.
   */
  const cmd = make();
  const handlers = createHandlers(() => repo, {
    onGetDoc(doc) {
      // Attach doc event streaming when a document is successfully retrieved.
      if (typeof doc.events === 'function') {
        attachDoc(port, doc, life.dispose$);
      }
    },
  });

  cmd.host(port, handlers);

  /**
   * Safety:
   * - Handle "messageerror" (structured clone failures etc) via the shared helper.
   */
  onMessageErrorHandler(port, repo, sendEvent, life);
};
