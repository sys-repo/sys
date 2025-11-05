import { c } from '../../-test.ts';

type M = { kind: 'ping'; id: string };

/**
 * Minimal worker that echoes a ping → pong.
 */
self.onmessage = (ev: MessageEvent<M>) => {
  const m = ev.data;

  console.info(c.yellow('\nworker/onmessage:\n'), ev, '\n');

  if (m?.kind === 'ping') {
    postMessage({ kind: 'pong', id: m.id });
  }
};
