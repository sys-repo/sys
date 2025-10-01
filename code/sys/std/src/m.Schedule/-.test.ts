import { type t, describe, expect, it } from '../-test.ts';
import { Schedule } from '../mod.ts';
import { Rx } from './common.ts';

describe(`Schedule`, () => {
  const life = (disposed = false): t.LifeLike => ({ disposed });

  it('API', async () => {
    const m = await import('@sys/std');
    expect(m.Schedule).to.equal(Schedule);

    const importAsync = await import('@sys/std/async');
    const moduleAsync = await import('../-exports/sys.std.async.ts');

    expect(importAsync).to.equal(moduleAsync);
    expect(importAsync.Schedule).to.equal(Schedule);
  });

  describe('static', () => {
    describe('Schedule.micro (static)', () => {
      it('is callable & awaitable', async () => {
        const s = Schedule.micro;
        expect(typeof s === 'function').to.be.true;

        // callable - noop
        s(() => {});

        // awaitable hop
        const p = s();
        expect(typeof p.then === 'function').to.be.true;
        await p;
      });

      it('fires callback on a microtask; not same tick', async () => {
        const calls: string[] = [];
        Schedule.micro(() => calls.push('cb'));
        expect(calls).to.eql([]); // same tick: not yet
        await Schedule.micro(); // one micro hop
        expect(calls).to.eql(['cb']);
      });
    });

    describe('Schedule.macro (static)', () => {
      it('is callable & awaitable', async () => {
        const s = Schedule.macro;
        expect(typeof s === 'function').to.be.true;

        // callable - noop
        s(() => {});
        await s(); // should resolve
      });

      it('setTimeout(0)-style hop (micro hop does not flush it)', async () => {
        const calls: string[] = [];
        Schedule.macro(() => calls.push('cb'));

        // micro hop should not run macro task
        await Promise.resolve();
        expect(calls).to.eql([]);

        // macro hop should run it
        await Schedule.macro();
        expect(calls).to.eql(['cb']);
      });
    });

    describe('Schedule.raf (static)', () => {
      it('is callable & awaitable', async () => {
        const s = Schedule.raf;
        expect(typeof s === 'function').to.be.true;

        // callable - noop
        s(() => {});
        await s(); // raf (or fallback) hop
      });

      it('runs on next frame (or ~16ms fallback) before/after checks are stable', async () => {
        const calls: string[] = [];
        Schedule.raf(() => calls.push('cb'));
        expect(calls).to.eql([]); // same tick
        await Schedule.raf();
        expect(calls).to.eql(['cb']);
      });
    });

    describe('ordering (static)', () => {
      it('each hop guarantees its own callback ran; overall order is unspecified', async () => {
        const order: string[] = [];

        Schedule.micro(() => order.push('micro'));
        Schedule.macro(() => order.push('macro'));
        Schedule.raf(() => order.push('raf'));

        // After a micro hop, the micro callback must have fired (regardless of others).
        await Schedule.micro();
        expect(order.includes('micro')).to.eql(true);

        // After a macro hop, the macro callback must have fired.
        await Schedule.macro();
        expect(order.includes('macro')).to.eql(true);

        // After a raf hop (or fallback), the raf callback must have fired.
        await Schedule.raf();
        expect(order.includes('raf')).to.eql(true);

        // All three exactly once (idempotent check for this test shape).
        expect(order.sort()).to.eql(['macro', 'micro', 'raf'].sort());
      });
    });

    describe('Schedule.frames(n)', () => {
      it('default: frames() == frames(1)', async () => {
        const originalRaf = Schedule.raf;
        let calls = 0;

        (Schedule as any).raf = ((...args: unknown[]) => {
          calls += 1;
          // @ts-expect-error forward to original
          return originalRaf(...args);
        }) as typeof Schedule.raf;

        try {
          await Schedule.frames();
          expect(calls).to.eql(1);
        } finally {
          (Schedule as any).raf = originalRaf;
        }
      });

      it('n=0 resolves immediately and does not call raf', async () => {
        const originalRaf = Schedule.raf;
        let calls = 0;

        (Schedule as any).raf = ((...args: unknown[]) => {
          calls += 1;
          // @ts-expect-error forward to original
          return originalRaf(...args);
        }) as typeof Schedule.raf;

        try {
          await Schedule.frames(0);
          expect(calls).to.eql(0);
        } finally {
          (Schedule as any).raf = originalRaf;
        }
      });

      it('n=1 invokes raf() once and resolves', async () => {
        const originalRaf = Schedule.raf;
        let calls = 0;

        (Schedule as any).raf = ((...args: unknown[]) => {
          calls += 1;
          // @ts-expect-error forward to original
          return originalRaf(...args);
        }) as typeof Schedule.raf;

        try {
          await Schedule.frames(1);
          expect(calls).to.eql(1);
        } finally {
          (Schedule as any).raf = originalRaf;
        }
      });

      it('n=2 invokes raf() twice and resolves', async () => {
        const originalRaf = Schedule.raf;
        let calls = 0;

        (Schedule as any).raf = ((...args: unknown[]) => {
          calls += 1;
          // @ts-expect-error forward to original
          return originalRaf(...args);
        }) as typeof Schedule.raf;

        try {
          await Schedule.frames(2);
          expect(calls).to.eql(2);
        } finally {
          (Schedule as any).raf = originalRaf;
        }
      });

      it('n=3 invokes raf() three times and resolves', async () => {
        const originalRaf = Schedule.raf;
        let calls = 0;

        (Schedule as any).raf = ((...args: unknown[]) => {
          calls += 1;
          // @ts-expect-error forward to original
          return originalRaf(...args);
        }) as typeof Schedule.raf;

        try {
          await Schedule.frames(3);
          expect(calls).to.eql(3);
        } finally {
          (Schedule as any).raf = originalRaf;
        }
      });

      it('works even when mixed with other raf work', async () => {
        const seq: string[] = [];
        const originalRaf = Schedule.raf;
        let calls = 0;

        (Schedule as any).raf = ((...args: unknown[]) => {
          calls += 1;
          // @ts-expect-error forward to original
          return originalRaf(...args);
        }) as typeof Schedule.raf;

        try {
          // Schedule a callback around the frames call to ensure no interference.
          Schedule.raf(() => seq.push('cb'));
          await Schedule.frames(2);
          seq.push('after-frames');

          // Presence/shape assertions (ordering is environment-dependent, so be lenient)
          expect(calls).to.eql(3); // two from frames(2) + one from our cb raf
          expect(seq.includes('cb')).to.eql(true);
          expect(seq.includes('after-frames')).to.eql(true);
        } finally {
          (Schedule as any).raf = originalRaf;
        }
      });

      it('n<0 behaves as a no-op (no raf calls)', async () => {
        const originalRaf = Schedule.raf;
        let calls = 0;

        (Schedule as any).raf = ((...args: unknown[]) => {
          calls += 1;
          // @ts-expect-error forward to original
          return originalRaf(...args);
        }) as typeof Schedule.raf;

        try {
          await Schedule.frames(-5);
          expect(calls).to.eql(0);
        } finally {
          (Schedule as any).raf = originalRaf;
        }
      });
    });

    describe('Schedule.queue(..)', () => {
      it('fires the task once on the microtask queue by default', async () => {
        let count = 0;
        Schedule.queue(() => count++);
        await Schedule.micro(); // hop to flush
        expect(count).to.eql(1);
      });

      it('does not fire more than once even if awaited multiple times', async () => {
        let count = 0;
        const life = Schedule.queue(() => count++);
        await Schedule.micro();
        expect(count).to.eql(1);

        // Hop again; should not re-fire
        await Schedule.micro();
        expect(count).to.eql(1);
        expect(life.disposed).to.eql(true);
      });

      it('supports raf queue', async () => {
        let count = 0;
        Schedule.queue(() => count++, { queue: 'raf' });
        await Schedule.raf();
        expect(count).to.eql(1);
      });

      it('supports frame count queue', async () => {
        let count = 0;
        Schedule.queue(() => count++, { queue: { frames: 2 } });
        await Schedule.frames(2);
        expect(count).to.eql(1);
      });

      it('supports millisecond delay queue', async () => {
        let count = 0;
        Schedule.queue(() => count++, { queue: { ms: 10 } });
        await new Promise((res) => setTimeout(res, 20));
        expect(count).to.eql(1);
      });

      it('cancels if lifecycle is disposed before firing', async () => {
        let count = 0;
        const life = Schedule.queue(() => count++, { queue: { ms: 20 } });
        life.dispose();
        await new Promise((res) => setTimeout(res, 30));
        expect(count).to.eql(0);
      });

      it('overload: once(task, queue, until)', async () => {
        let count = 0;
        const gate = Rx.lifecycle();
        Schedule.queue(() => count++, 'raf', gate.dispose$);
        // cancel before the raf tick
        gate.dispose();
        await Schedule.raf();
        expect(count).to.eql(0);
      });

      it('overload: once(task, { queue, until })', async () => {
        let count = 0;
        const gate = Rx.lifecycle();
        Schedule.queue(() => count++, { queue: 'micro', until: gate.dispose$ });
        // dispose synchronously before the micro hop
        gate.dispose();
        await Schedule.micro();
        expect(count).to.eql(0);
      });

      it('queue: { ms: 0 } behaves as macrotask (fires once)', async () => {
        let count = 0;
        Schedule.queue(() => count++, { queue: { ms: 0 } });
        await new Promise((res) => setTimeout(res, 0));
        expect(count).to.eql(1);
      });

      it('queue: { frames: 0 } fires on the next raf', async () => {
        let count = 0;
        Schedule.queue(() => count++, { queue: { frames: 0 } });
        await Schedule.raf();
        expect(count).to.eql(1);
      });

      it('returns a lifecycle that auto-disposes after running', async () => {
        let ran = false;
        const life = Schedule.queue(() => (ran = true), { queue: 'micro' });
        expect(life.disposed).to.eql(false);
        await Schedule.micro();
        expect(ran).to.eql(true);
        expect(life.disposed).to.eql(true);
      });
    });
  });

  describe('instance (w/ lifecycle)', () => {
    it('returns a curried ScheduleFn (callable & awaitable)', async () => {
      const schedule = Schedule.make(life()); // default micro
      expect(typeof schedule === 'function').to.be.true;

      // callable - noop
      schedule(() => {});

      // awaitable hop
      const p = schedule();
      expect(typeof (p as any).then === 'function').to.be.true;
      await p;
    });

    it('micro: fires after a micro hop', async () => {
      const calls: string[] = [];
      const schedule = Schedule.make(life(), 'micro');

      schedule(() => calls.push('cb'));
      expect(calls).to.eql([]);
      await schedule(); // hop
      expect(calls).to.eql(['cb']);
    });

    it('macro: setTimeout(0) style hop, not flushed by a micro hop', async () => {
      const calls: string[] = [];
      const schedule = Schedule.make(life(), 'macro');

      schedule(() => calls.push('cb'));

      // micro hop shouldn't flush macro
      await Promise.resolve();
      expect(calls).to.eql([]);

      // macro hop flushes
      await schedule();
      expect(calls).to.eql(['cb']);
    });

    it('raf: runs next frame (or fallback); await resolves after run', async () => {
      const calls: string[] = [];
      const schedule = Schedule.make(life(), 'raf');

      schedule(() => calls.push('cb'));
      await schedule();
      expect(calls).to.eql(['cb']);
    });

    it('lifecycle guard: skips callback if disposed before run (micro)', async () => {
      const l = life(false);
      const calls: number[] = [];
      const schedule = Schedule.make(l, 'micro');

      schedule(() => calls.push(1));
      (l as any).disposed = true; // dispose before micro flush

      await schedule(); // hop resolves regardless
      expect(calls).to.eql([]); // callback did not run
    });

    it('lifecycle guard: skips callback if disposed before run (macro)', async () => {
      const l = life(false);
      const calls: number[] = [];
      const schedule = Schedule.make(l, 'macro');

      schedule(() => calls.push(1));
      (l as any).disposed = true;

      await schedule();
      expect(calls).to.eql([]);
    });

    it('awaitable hop resolves even if disposed (no callback run)', async () => {
      const l = life(true);
      const schedule = Schedule.make(l, 'micro');
      await schedule(); // should resolve without throwing
    });

    it('does nothing when created with disposed life (no-op fast path for callbacks)', async () => {
      const l = life(true);
      const calls: number[] = [];
      const schedule = Schedule.make(l, 'micro');

      schedule(() => calls.push(1));
      await schedule(); // hop resolves
      expect(calls).to.eql([]); // no callback
    });

    it('each hop guarantees its own callback ran; overall order is unspecified', async () => {
      const l = life(false);
      const order: string[] = [];

      const micro = Schedule.make(l, 'micro');
      const macro = Schedule.make(l, 'macro');
      const raf = Schedule.make(l, 'raf');

      micro(() => order.push('micro'));
      macro(() => order.push('macro'));
      raf(() => order.push('raf'));

      // After awaiting each schedule, its callback must have run.
      await micro();
      expect(order.includes('micro')).to.eql(true);

      await macro();
      expect(order.includes('macro')).to.eql(true);

      await raf();
      expect(order.includes('raf')).to.eql(true);

      // All three exactly once (idempotent for this test shape).
      expect(order.length).to.eql(3);
      expect(order.sort()).to.eql(['macro', 'micro', 'raf'].sort());
    });
  });
});
