import { describe, expect, it } from '../../-test.ts';
import { Time } from '../mod.ts';

describe('Time.frame', () => {
  describe('Time.nextFrame', () => {
    it('resolves on fallback (SSR / no RAF)', async () => {
      const restore = removeRAF();
      try {
        let reached = false;
        await Time.nextFrame();
        reached = true;
        expect(reached).to.eql(true);
      } finally {
        restore();
      }
    });

    it('orders after microtasks (fallback path)', async () => {
      const restore = removeRAF();
      try {
        const order: string[] = [];
        Promise.resolve().then(() => order.push('micro'));
        const p = (async () => {
          await Time.nextFrame();
          order.push('after-frame');
        })();
        await p;
        expect(order).to.eql(['micro', 'after-frame']);
      } finally {
        restore();
      }
    });

    it('rejects with AbortError if aborted before frame (fallback path)', async () => {
      const restore = removeRAF();
      try {
        const ctrl = new AbortController();
        const p = Time.nextFrame({ signal: ctrl.signal });
        ctrl.abort();
        let name = '';
        try {
          await p;
        } catch (err: any) {
          name = err?.name ?? '';
        }
        expect(name).to.eql('AbortError');
      } finally {
        restore();
      }
    });

    it('resolves only after a RAF tick when RAF is present', async () => {
      const raf = fakeRAF();
      try {
        let resolved = false;
        const p = Time.nextFrame().then(() => {
          resolved = true;
        });
        await tick();
        expect(resolved).to.eql(false); //  ← not yet, waiting for a frame.
        raf.step(); //                      ← deliver one frame.
        await tick();
        expect(resolved).to.eql(true);
      } finally {
        raf.restore();
      }
    });

    it('cancels scheduled RAF on abort', async () => {
      const raf = fakeRAF();
      try {
        const ctrl = new AbortController();
        const p = Time.nextFrame({ signal: ctrl.signal }).catch(() => {});
        ctrl.abort();
        await tick();
        expect(raf.cancelCount).to.eql(1);
        await p;
      } finally {
        raf.restore();
      }
    });

    it('accepts AbortSignal directly or via { signal } (RAF path)', async () => {
      const raf = fakeRAF();
      try {
        // ↓ direct AbortSignal:
        {
          const ctrl = new AbortController();
          const p = Time.nextFrame(ctrl.signal);
          raf.step(); // 1st frame
          await flush(2);
          await p; // resolves
        }
        // ↓ options object { signal }:
        {
          const ctrl = new AbortController();
          const p = Time.nextFrame({ signal: ctrl.signal });
          raf.step(); //    ← 1st frame
          await flush(2);
          await p; //       ← resolves
        }
      } finally {
        raf.restore();
      }
    });
  });

  describe('Time.doubleFrame', () => {
    it('resolves on fallback (SSR / no RAF)', async () => {
      const restore = removeRAF();
      try {
        let reached = false;
        await Time.doubleFrame();
        reached = true;
        expect(reached).to.eql(true);
      } finally {
        restore();
      }
    });

    it('requires two RAF steps when RAF is present', async () => {
      const raf = fakeRAF();
      try {
        let resolved = false;
        const p = Time.doubleFrame().then(() => {
          resolved = true;
        });

        await flush(); // let initial microtasks settle (optional).
        expect(resolved).to.eql(false);

        raf.step(); //     ← 1st frame delivered.
        await flush(2); // ← 1) schedule 2nd RAF → 2) settle any follow-on tasks.
        expect(resolved).to.eql(false); // still waiting for the 2nd frame

        raf.step(); //     ← 2nd frame delivered.
        await flush(2); // ← 1) resolve promise, 2) run `p.then(...)`
        expect(resolved).to.eql(true);

        await p;
      } finally {
        raf.restore();
      }
    });

    it('rejects with AbortError if aborted before completion (RAF path)', async () => {
      const raf = fakeRAF();
      try {
        const ctrl = new AbortController();
        const p = Time.doubleFrame({ signal: ctrl.signal });
        // Abort before delivering any frames
        ctrl.abort();
        let name = '';
        try {
          await p;
        } catch (err: any) {
          name = err?.name ?? '';
        }
        expect(name).to.eql('AbortError');
      } finally {
        raf.restore();
      }
    });

    it('accepts AbortSignal directly or via { signal } (RAF path)', async () => {
      const raf = fakeRAF();
      try {
        // ↓ direct AbortSignal:
        {
          const ctrl = new AbortController();
          const p = Time.doubleFrame(ctrl.signal);
          raf.step(); //    ← 1st frame
          await flush(2);
          raf.step(); //    ← 2nd frame
          await flush(2);
          await p; //       ← resolves
        }
        // ↓ options object { signal }:
        {
          const ctrl = new AbortController();
          const p = Time.doubleFrame({ signal: ctrl.signal });
          raf.step(); //    ← 1st frame
          await flush(2);
          raf.step(); //    ← 2nd frame
          await flush(2);
          await p; //       ← resolves
        }
      } finally {
        raf.restore();
      }
    });
  });
});

/**
 * Helpers:
 */
type RafFn = (cb: FrameRequestCallback) => number;
type CancelRafFn = (id: number) => void;

const tick = () => Promise.resolve(); // microtask.
const flush = async (n = 1) => {
  for (let i = 0; i < n; i++) await Promise.resolve();
};

const hasRAF = () =>
  typeof (globalThis as any).requestAnimationFrame === 'function' &&
  typeof (globalThis as any).cancelAnimationFrame === 'function';

function removeRAF() {
  const g = globalThis as any;
  const prev = {
    requestAnimationFrame: g.requestAnimationFrame as RafFn | undefined,
    cancelAnimationFrame: g.cancelAnimationFrame as CancelRafFn | undefined,
  };
  delete g.requestAnimationFrame;
  delete g.cancelAnimationFrame;
  return () => {
    if (prev.requestAnimationFrame) g.requestAnimationFrame = prev.requestAnimationFrame;
    if (prev.cancelAnimationFrame) g.cancelAnimationFrame = prev.cancelAnimationFrame;
  };
}

function fakeRAF() {
  const g = globalThis as any;
  const prev = {
    requestAnimationFrame: g.requestAnimationFrame as RafFn | undefined,
    cancelAnimationFrame: g.cancelAnimationFrame as CancelRafFn | undefined,
  };

  let idSeq = 1;
  const q = new Map<number, FrameRequestCallback>();
  let cancelCount = 0;

  const requestAnimationFrame: RafFn = (cb) => {
    const id = idSeq++;
    q.set(id, cb);
    return id;
  };

  const cancelAnimationFrame: CancelRafFn = (id) => {
    if (q.delete(id)) cancelCount++;
  };

  const step = () => {
    const entry = q.entries().next().value as [number, FrameRequestCallback] | undefined;
    if (!entry) return false;
    const [id, cb] = entry;
    q.delete(id);
    cb(performance.now());
    return true;
  };

  g.requestAnimationFrame = requestAnimationFrame;
  g.cancelAnimationFrame = cancelAnimationFrame;

  const restore = () => {
    if (prev.requestAnimationFrame) g.requestAnimationFrame = prev.requestAnimationFrame;
    else delete g.requestAnimationFrame;
    if (prev.cancelAnimationFrame) g.cancelAnimationFrame = prev.cancelAnimationFrame;
    else delete g.cancelAnimationFrame;
  };

  return {
    step,
    restore,
    get cancelCount() {
      return cancelCount;
    },
  };
}
