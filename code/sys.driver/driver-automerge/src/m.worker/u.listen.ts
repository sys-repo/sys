import type { t } from './common.ts';
import { attach } from './u.attach.ts';
import { Wire } from './u.evt.wire.ts';

export const listen: t.CrdtWorkerLib['listen'] = (self, repo) => {
  self.addEventListener('message', (ev) => {
    const data = ev.data as { kind?: string; port?: MessagePort } | undefined;
    if (data?.kind !== Wire.Stream.attach) return;

    const port = ev.ports?.[0] ?? data.port;
    if (!port) return;

    attach(port, repo);
  });
};
