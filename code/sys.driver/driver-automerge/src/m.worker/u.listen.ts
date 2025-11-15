import { type t, Is } from './common.ts';
import { attach } from './u.attach.ts';
import { Wire } from './u.wire.ts';

/**
 * Install worker-side wiring for CRDT repo events.
 */
export const listen: t.CrdtWorkerLib['listen'] = (self, repo) => {
  /**
   * Message handler: look for `crdt:attach` and bind the provided port.
   */
  self.addEventListener('message', (ev) => {
    const data = ev.data as { kind?: string; port?: MessagePort } | undefined;
    if (data?.kind !== Wire.Kind.attach) return;

    const port = ev.ports?.[0] ?? data.port;
    if (!port) return;

    attach(port, repo);
  });

  /**
   * Signal to `CrdtWorker.spawn` that this worker has installed its
   * message handler and is ready to accept a `crdt:attach` port.
   */
  if (Is.func(self.postMessage)) self.postMessage({ kind: Wire.Kind.workerReady });
};
