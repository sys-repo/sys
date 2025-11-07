import { afterAll, beforeAll, c, describe, it, Rx } from '../../-test.ts';

describe('CRDT/Automerge: on background worker', () => {
  const url = new URL('./worker.ts', import.meta.url);
  let w: Worker;

  beforeAll(() => void (w = createWorker(url)));
  afterAll(() => w.terminate());

  /**
   * Sample: calling a repo on a background thread.
   */
  it('run', async () => {
    const life = Rx.abortable();
    const { signal } = life;

    // General logging handlers (attached for the duration of this test).
    const onMessage = (ev: MessageEvent) => {
      console.info(c.green('worker:message →'), ev.data);
    };
    const onMessageError = (ev: MessageEvent) => {
      console.error(c.yellow('worker:messageerror →'), ev);
    };
    const onError = (ev: ErrorEvent) => {
      console.error(c.yellow('worker:error →'), ev.message);
    };

    w.addEventListener('message', onMessage, { signal });
    w.addEventListener('messageerror', onMessageError, { signal });
    w.addEventListener('error', onError, { signal });

    // Await the first "ready" signal from the worker so the test is deterministic.
    await new Promise<void>((resolve) => {
      const once = (ev: MessageEvent) => {
        if (ev.data?.kind === 'ready') {
          console.info(c.green('worker:ready ✅'));
          w.removeEventListener('message', once);
          resolve();
        }
      };
      w.addEventListener('message', once);
    });

    life.dispose();
  });
});

/**
 * Creates a Deno-aware Worker.
 *
 * - Runs stable in browser and Node (ignores `deno:` field there)
 * - In Deno, inherits permissions *if available* (requires `--unstable-worker-options`)
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
