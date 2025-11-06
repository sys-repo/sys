import { afterAll, beforeAll, c, describe, expect, it, slug } from '../../-test.ts';
import { createWorker } from '../u.ts';

import { createWorkerMirror } from './worker-mirror.ts';

describe('immutable/worker: smoke', () => {
  const url = new URL('./immutable.worker.ts', import.meta.url);
  let w: Worker;
  beforeAll(() => void (w = createWorker(url)));
  afterAll(() => w.terminate());

  // 🌸 ---------- ADDED: smoke-run-test-using-createWorkerMirror-proxy ----------
  it('run', async () => {
    type Counter = { count: number };

    // Mirror + worker under test:
    const { worker, ref } = createWorkerMirror<Counter>(
      new URL('./immutable.worker.ts', import.meta.url),
    );

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
  // 🌸 ---------- /ADDED ----------

  // 🌸 ---------- ADDED: smoke-run-test-using-worker-patches (narrow-non-remove) ----------
  //   it('run', async () => {
  //     type PatchOp =
  //       | { op: 'add'; path: string; value: unknown }
  //       | { op: 'replace'; path: string; value: unknown }
  //       | { op: 'remove'; path: string };
  //
  //     function once<K extends string, T extends { kind: K }>(kind: K): Promise<T> {
  //       return new Promise((resolve) => {
  //         const handler = (e: MessageEvent) => {
  //           const msg = e.data as { kind?: string };
  //           if (msg?.kind === kind) {
  //             w.removeEventListener('message', handler);
  //             resolve(e.data as T);
  //           }
  //         };
  //         w.addEventListener('message', handler);
  //       });
  //     }
  //
  //     // 1) Initial snapshot.
  //     const init = await once<'init', { kind: 'init'; state: { count: number } }>('init');
  //     expect(init.state).to.eql({ count: 0 });
  //
  //     // 2) Increment → expect a patch on "/count" with 1 (add|replace).
  //     w.postMessage({ kind: 'increment' });
  //     const p1 = await once<'patch', { kind: 'patch'; patches: readonly PatchOp[] }>('patch');
  //     const op1 = p1.patches.find((p) => p.path === '/count')!;
  //     expect(op1).to.not.eql(undefined);
  //     expect(['add', 'replace']).to.contain(op1.op);
  //     if (op1.op !== 'remove') expect(op1.value).to.eql(1);
  //
  //     // 3) Set → expect a patch on "/count" with 7 (add|replace).
  //     w.postMessage({ kind: 'set', value: 7 });
  //     const p2 = await once<'patch', { kind: 'patch'; patches: readonly PatchOp[] }>('patch');
  //     const op2 = p2.patches.find((p) => p.path === '/count')!;
  //     expect(op2).to.not.eql(undefined);
  //     expect(['add', 'replace']).to.contain(op2.op);
  //     if (op2.op !== 'remove') expect(op2.value).to.eql(7);
  //   });
  // 🌸 ---------- /ADDED ----------
});
