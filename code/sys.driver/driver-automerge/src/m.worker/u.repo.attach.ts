import { type t, Rx, Schedule, Try } from './common.ts';
import { Wire } from './u.event.ts';
import { onMessageErrorHandler } from './u.onErrorMessage.ts';

/**
 * Attaches a real repo instance to a `MessagePort` inside the worker.
 * Forwards repo lifecycle and event streams over the port using wire-safe payloads.
 */
export const attach: t.CrdtWorkerLib['attach'] = (port, repo) => {
  port.start?.();

  const dispatch = (e: t.WireEvent) => port.postMessage(e);
  const send = (e: t.WireRepoEventPayload) => dispatch(Wire.event(Wire.Stream.repo, e));

  const life = Rx.abortable(repo.dispose$);
  life.dispose$.subscribe(() => {
    send({ type: 'stream/close', payload: {} });
    Try.catch(() => port.close?.());
  });

  // Stream open; emit initial readiness snapshot.
  const sendReady = () => send({ type: 'ready', payload: { ready: repo.ready } });
  send({ type: 'stream/open', payload: {} });
  sendReady(); //               send snapshot immediately for already-listening clients...
  Schedule.micro(sendReady); // ...and once more on the next microtask for late listeners

  /**
   * Live forwarding (wire-safe):
   */
  const ev = repo.events(life);

  // Forward continuous ready$ updates.
  ev.ready$.subscribe((ready) => send({ type: 'ready', payload: { ready } }));

  ev.prop$.subscribe((e) => {
    const payload: t.WireRepoPropChange = {
      prop: e.prop,
      before: toWireProps(e.before),
      after: toWireProps(e.after),
    };

    send({ type: 'prop-change', payload });
  });

  // Network events are already discriminated data payloads; forward as-is.
  ev.network$.subscribe((payload: t.CrdtNetworkChangeEvent) => send(payload));

  /**
   * Safety:
   * If the port encounters "messageerror" (structured clone failures),
   * emit a diagnostic and close after repeated faults (handled internally).
   */
  onMessageErrorHandler(port, repo, dispatch, life);
};

/**
 * Helpers:
 */
function toWireProps(p: t.CrdtRepoProps): t.WireRepoProps {
  return {
    ready: p.ready,
    id: p.id,
    sync: {
      peers: [...p.sync.peers],
      urls: [...p.sync.urls],
      enabled: p.sync.enabled,
    },
    stores: [...p.stores],
  };
}
