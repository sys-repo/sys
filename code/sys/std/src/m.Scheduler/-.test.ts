import { type t, describe, expect, it } from '../-test.ts';
import { Scheduler } from '../mod.ts';

describe(`Scheduler`, () => {
  const life = (disposed = false): t.LifeLike => ({ disposed });

  it('API', async () => {
    const m = await import('@sys/std');
    expect(m.Scheduler).to.equal(Scheduler);
  });

  describe('static', () => {
    describe('Scheduler.micro (static)', () => {
      it('is callable & awaitable', async () => {
        const s = Scheduler.micro;
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
        Scheduler.micro(() => calls.push('cb'));
        expect(calls).to.eql([]); // same tick: not yet
        await Scheduler.micro(); // one micro hop
        expect(calls).to.eql(['cb']);
      });
    });

    describe('Scheduler.macro (static)', () => {
      it('is callable & awaitable', async () => {
        const s = Scheduler.macro;
        expect(typeof s === 'function').to.be.true;

        // callable - noop
        s(() => {});
        await s(); // should resolve
      });

      it('setTimeout(0)-style hop (micro hop does not flush it)', async () => {
        const calls: string[] = [];
        Scheduler.macro(() => calls.push('cb'));

        // micro hop should not run macro task
        await Promise.resolve();
        expect(calls).to.eql([]);

        // macro hop should run it
        await Scheduler.macro();
        expect(calls).to.eql(['cb']);
      });
    });

    describe('Scheduler.raf (static)', () => {
      it('is callable & awaitable', async () => {
        const s = Scheduler.raf;
        expect(typeof s === 'function').to.be.true;

        // callable - noop
        s(() => {});
        await s(); // raf (or fallback) hop
      });

      it('runs on next frame (or ~16ms fallback) before/after checks are stable', async () => {
        const calls: string[] = [];
        Scheduler.raf(() => calls.push('cb'));
        expect(calls).to.eql([]); // same tick
        await Scheduler.raf();
        expect(calls).to.eql(['cb']);
      });
    });

    describe('Scheduler (static) ordering', () => {
      it('each hop guarantees its own callback ran; overall order is unspecified', async () => {
        const order: string[] = [];

        Scheduler.micro(() => order.push('micro'));
        Scheduler.macro(() => order.push('macro'));
        Scheduler.raf(() => order.push('raf'));

        // After a micro hop, the micro callback must have fired (regardless of others).
        await Scheduler.micro();
        expect(order.includes('micro')).to.eql(true);

        // After a macro hop, the macro callback must have fired.
        await Scheduler.macro();
        expect(order.includes('macro')).to.eql(true);

        // After a raf hop (or fallback), the raf callback must have fired.
        await Scheduler.raf();
        expect(order.includes('raf')).to.eql(true);

        // All three exactly once (idempotent check for this test shape).
        expect(order.sort()).to.eql(['macro', 'micro', 'raf'].sort());
      });
    });
  });

  describe('Scheduler.scheduler (instance w/ lifecycle)', () => {
    it('returns a curried ScheduleFn (callable & awaitable)', async () => {
      const schedule = Scheduler.make(life()); // default micro
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
      const schedule = Scheduler.make(life(), 'micro');

      schedule(() => calls.push('cb'));
      expect(calls).to.eql([]);
      await schedule(); // hop
      expect(calls).to.eql(['cb']);
    });

    it('macro: setTimeout(0) style hop, not flushed by a micro hop', async () => {
      const calls: string[] = [];
      const schedule = Scheduler.make(life(), 'macro');

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
      const schedule = Scheduler.make(life(), 'raf');

      schedule(() => calls.push('cb'));
      await schedule();
      expect(calls).to.eql(['cb']);
    });

    it('lifecycle guard: skips callback if disposed before run (micro)', async () => {
      const l = life(false);
      const calls: number[] = [];
      const schedule = Scheduler.make(l, 'micro');

      schedule(() => calls.push(1));
      (l as any).disposed = true; // dispose before micro flush

      await schedule(); // hop resolves regardless
      expect(calls).to.eql([]); // callback did not run
    });

    it('lifecycle guard: skips callback if disposed before run (macro)', async () => {
      const l = life(false);
      const calls: number[] = [];
      const schedule = Scheduler.make(l, 'macro');

      schedule(() => calls.push(1));
      (l as any).disposed = true;

      await schedule();
      expect(calls).to.eql([]);
    });

    it('awaitable hop resolves even if disposed (no callback run)', async () => {
      const l = life(true);
      const schedule = Scheduler.make(l, 'micro');
      await schedule(); // should resolve without throwing
    });

    it('does nothing when created with disposed life (no-op fast path for callbacks)', async () => {
      const l = life(true);
      const calls: number[] = [];
      const schedule = Scheduler.make(l, 'micro');

      schedule(() => calls.push(1));
      await schedule(); // hop resolves
      expect(calls).to.eql([]); // no callback
    });

    it('each hop guarantees its own callback ran; overall order is unspecified', async () => {
      const l = life(false);
      const order: string[] = [];

      const micro = Scheduler.make(l, 'micro');
      const macro = Scheduler.make(l, 'macro');
      const raf = Scheduler.make(l, 'raf');

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
