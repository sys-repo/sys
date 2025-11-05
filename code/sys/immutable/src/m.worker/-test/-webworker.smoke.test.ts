import { afterAll, beforeAll, c, describe, expect, it, slug } from '../../-test.ts';

describe('immutable/worker: smoke', () => {
  const url = new URL('./-webworker.smoke.ping.worker.ts', import.meta.url);
  let w: Worker;

  beforeAll(() => {
    w = new Worker(url, { type: 'module' });
  });

  afterAll(() => {
    w.terminate();
  });

  it('ping → pong roundtrip', async () => {
    const id = slug();

    const recv = new Promise<{ kind: string; id: string }>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('timeout waiting for pong')), 2000);
      const onMsg = (ev: MessageEvent) => {
        clearTimeout(timeout);
        w.removeEventListener('message', onMsg);
        resolve(ev.data);
      };
      w.addEventListener('message', onMsg);
    });

    const payload = { kind: 'ping', id };
    console.info(c.cyan('\nmain/postMessage:\n'), payload, '\n');
    w.postMessage(payload);
    const msg = await recv;

    console.info(c.cyan('\nmain/response:\n'), msg, '\n');

    expect(msg.kind).to.equal('pong');
    expect(msg.id).to.equal(id);
  });
});
