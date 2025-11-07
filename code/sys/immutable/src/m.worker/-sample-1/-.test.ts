import { afterAll, beforeAll, c, describe, expect, it, slug } from '../../-test.ts';
import { createWorker } from '../u.ts';

import { createWorkerMirror } from './worker-mirror.ts';

/**
 * SAMPLE ONLY (WIP) - 🐷
 */
describe('immutable/worker: smoke', () => {
  const url = new URL('./immutable.worker.ts', import.meta.url);

  it('run', async () => {
    type Counter = { count: number };

    // Mirror + worker under test:
    const { worker, ref } = createWorkerMirror<Counter>(url);

    // Helper: wait for a single worker message of a given kind.
    const once = <K extends string, T extends { kind: K }>(kind: K) =>
      new Promise<T>((resolve) => {
        const handler = (e: MessageEvent) => {
          const msg = e.data as { kind?: string };
          if (msg?.kind === kind) {
            worker.removeEventListener('message', handler);
            resolve(e.data as T);
          }
        };
        worker.addEventListener('message', handler);
      });

    // Host-side minimal proxy that *feels* like an ImmutableRef:
    // - current: mirrors worker state
    // - change(fn): we keep this semantic by offering domain ops that message the worker
    const proxy = {
      get current(): Counter {
        return ref.current;
      },
      increment() {
        worker.postMessage({ kind: 'increment' } as const);
        return once('patch'); // resolve when mirror applied the patch
      },
      set(n: number) {
        worker.postMessage({ kind: 'set', value: n } as const);
        return once('patch'); // resolve when mirror applied the patch
      },
    };

    // 1) Initial snapshot arrives; mirror initializes.
    await once<'init', { kind: 'init'; state: Counter }>('init');
    expect(ref.current).to.eql({ count: 0 });
    console.log(c.cyan('proxy.current:'), proxy.current);

    // 2) Increment via proxy → mirror updates.
    await proxy.increment();
    expect(proxy.current.count).to.eql(1);
    console.log(c.cyan('proxy.current:'), proxy.current);

    // 3) Set via proxy → mirror updates to specific value.
    await proxy.set(7);
    expect(proxy.current.count).to.eql(7);
    console.log(c.cyan('proxy.current:'), proxy.current);
  });
});
