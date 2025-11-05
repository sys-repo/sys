import { afterAll, beforeAll, c, describe, expect, it, slug } from '../../-test.ts';

/**
 * Creates a Deno-aware Worker.
 *
 * ✅ Runs stable in browser and Node (ignores `deno:` field there)
 * ✅ In Deno, inherits permissions *if available* (requires `--unstable-worker-options`)
 * Keeps all runtime code stable — avoids CI failures when flag is off.
 */
export function createWorker(url: URL): Worker {
  const base: WorkerOptions = { type: 'module' };

  // Add Deno-specific extension only when supported.
  const denoExt =
    typeof Deno !== 'undefined'
      ? ({ deno: { permissions: 'inherit' as const } } as Record<string, unknown>)
      : {};
  return new Worker(url, { ...base, ...denoExt } as WorkerOptions);
}

describe('immutable/worker: smoke', () => {
  const url = new URL('./-webworker.smoke.ping.worker.ts', import.meta.url);
  let w: Worker;
  beforeAll(() => void (w = createWorker(url)));
  afterAll(() => w.terminate());

  it('ping → pong roundtrip', async () => {
    const id = slug();

    const recv = new Promise<{ kind: string; id: string }>((resolve, reject) => {
      const to = setTimeout(() => reject(new Error('timeout waiting for pong')), 8000);
      const onMsg = (ev: MessageEvent) => {
        clearTimeout(to);
        cleanup();
        resolve(ev.data);
      };
      const onErr = (ev: ErrorEvent) => {
        clearTimeout(to);
        cleanup();
        reject(new Error(`worker error: ${ev.message}`));
      };
      const cleanup = () => {
        w.removeEventListener('message', onMsg);
        w.removeEventListener('error', onErr);
      };
      w.addEventListener('message', onMsg);
      w.addEventListener('error', onErr);
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
