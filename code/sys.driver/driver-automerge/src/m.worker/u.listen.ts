import { type t, Is } from './common.ts';
import { attachRepo } from './u.attach.repo.ts';
import { Wire } from './u.wire.ts';

let configValue: t.CrdtWorkerSpawnConfig | undefined;
const configHandlers: ((c: t.CrdtWorkerSpawnConfig) => void | Promise<void>)[] = [];

export const onConfig = (fn: (c: t.CrdtWorkerSpawnConfig) => void | Promise<void>) => {
  if (configValue) {
    void fn(configValue);
  } else {
    configHandlers.push(fn);
  }
};

const deliverConfig = (c: t.CrdtWorkerSpawnConfig | undefined) => {
  if (!c) return;
  configValue = c;
  for (const fn of configHandlers) void fn(c);
  configHandlers.length = 0;
};

/**
 * Install worker-side wiring for CRDT repo events.
 */
export const listen: t.CrdtWorkerLib['listen'] = (self, repo) => {
  /**
   * Message handler: look for `crdt:attach` and bind the provided port.
   */
  self.addEventListener('message', (ev) => {
    const data = ev.data as
      | { kind?: string; port?: MessagePort; config?: t.CrdtWorkerSpawnConfig }
      | undefined;
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
