import { type t, Is } from './common.ts';
import { attachRepo } from './u.attach.repo.ts';
import { Wire } from './u.wire.ts';
import { deliverConfig } from './u.listen.onConfig.ts';

/**
 * Install worker-side wiring for CRDT repo events.
 */
export const listen: t.CrdtWorkerLib['listen'] = (self, repo) => {
  /**
   * Message handler: look for `crdt:attach` and bind the provided port.
   */
  self.addEventListener('message', (ev) => {
    type T = { kind?: string; port?: MessagePort; config?: t.CrdtWorkerSpawnConfig };
    const data = ev.data as T | undefined;

    if (data?.kind !== Wire.Kind.attach) return;
    if (data.config) deliverConfig(data.config);

    const port = ev.ports?.[0] ?? data.port;
    if (!port) return;

    attachRepo(port, repo);
  });

  /**
   * Signal to `CrdtWorker.spawn` that this worker has installed its
   * message handler and is ready to accept a `crdt:attach` port.
   */
  if (Is.func(self.postMessage)) self.postMessage({ kind: Wire.Kind.workerReady });
};
