import { Crdt } from '../../-exports/-fs/mod.ts';
import { CrdtWorker } from '../mod.ts';

/**
 * Single-repo worker host.
 * - Creates one real repo instance.
 * - Listens for 'crdt:attach' and wires the provided MessagePort to that repo.
 * - No manual 'stream/open' ack; CrdtWorker.attach emits lifecycle events already.
 */
const repo = await Crdt.repo({ dir: '.tmp/-worker' }).whenReady();

self.addEventListener('message', (ev: MessageEvent) => {
  const data = ev.data as { kind?: string; port?: MessagePort } | undefined;
  if (data?.kind !== 'crdt:attach') return;

  const port = ev.ports?.[0] ?? data.port;
  if (!port) return;

  CrdtWorker.attach(port, repo);
});
