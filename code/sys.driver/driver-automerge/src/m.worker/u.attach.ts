import { type t, Rx, Schedule, Try } from './common.ts';
import { Wire } from './u.evt.wire.ts';
import { onMessageErrorHandler } from './u.onErrorMessage.ts';

/**
 * Attaches a real repo instance to a `MessagePort` inside the worker.
 * Forwards repo lifecycle and event streams over the port using wire-safe payloads.
 */
export const attach: t.CrdtWorkerLib['attach'] = (port, repo) => {
  port.start?.();
  const dispatch = (e: t.WireEvent) => port.postMessage(e);
  const send = (e: t.WireRepoEventPayload) => dispatch(Wire.event(Wire.Stream.repo, e));

  /**
   * Lifecycle:
   */
  const life = Rx.abortable(repo.dispose$);
  life.dispose$.subscribe(() => {
    send({ type: 'stream/close', payload: {} });
    Try.catch(() => port.close?.());
  });

  /**
   * Open stream; emit initial readiness snapshots.
   */
  const sendReady = () => send({ type: 'ready', payload: { ready: repo.ready } });
  const sendSnapshot = () => send({ type: 'props/snapshot', payload: Wire.clone(repo) });

  // Send immediately for early listeners...
  send({ type: 'stream/open', payload: {} });
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
  ev.ready$.subscribe((ready) => send({ type: 'ready', payload: { ready } }));

  // Forward continuous prop$ updates:
  ev.prop$.subscribe((e) => {
    send({
      type: 'props/change',
      payload: {
        prop: e.prop,
        before: Wire.clone(e.before),
        after: Wire.clone(e.after),
      },
    });
  });

  // Network events are already discriminated data payloads; forward as-is:
  ev.network$.subscribe((payload) => send(payload));

  /**
   * Safety:
   *   If the port encounters "messageerror" (eg. structured clone failures),
   *   emit a diagnostic and close after repeated faults.
   */
  onMessageErrorHandler(port, repo, dispatch, life);
};
