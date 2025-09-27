import { Testing, describe, expect, it } from '../../-test.ts';
import { Rx } from '../../m.Rx/mod.ts';
import { Time } from '../mod.ts';

describe('Time Delay/Wait', () => {
  const calcDiff = (a: Date, b: Date = new Date()) => b.getTime() - a.getTime();

  describe('Time.delay', () => {
    it('TimeDelayPromise: response structure', () => {
      const res = Time.delay(0);
      expect(typeof res.cancel).to.eql('function');
      expect(res.is).to.eql({ cancelled: false, completed: false, done: false });
      expect(res.timeout).to.eql(0);
      res.cancel();
    });

    describe('msecs input', () => {
      it('10ms, ()=>', async () => {
        let fired = 0;
        const startedAt = new Date();
        const res = Time.delay(30, () => fired++);
        expect(fired).to.eql(0);
        expect(res.is).to.eql({ cancelled: false, completed: false, done: false });
        expect(res.timeout).to.eql(30);
        await res;
        expect(fired).to.eql(1);
        expect(calcDiff(startedAt)).to.be.closeTo(30, 50);
        expect(res.is).to.eql({ cancelled: false, completed: true, done: true });
      });

      it('0ms, ()=>', async () => {
        let fired = 0;
        const startedAt = new Date();
        const res = Time.delay(0, () => fired++);
        expect(fired).to.eql(0);
        await res;
        expect(fired).to.eql(1);
        expect(calcDiff(startedAt)).to.be.closeTo(0, 10); // NB: closer to zero.
        expect(res.is).to.eql({ cancelled: false, completed: true, done: true });
        expect(res.timeout).to.eql(0);
      });

      it('()=> | ← handler only, defaults to micro-task ("tick")', async () => {
        let fired = 0;
        const startedAt = new Date();
        const res = Time.delay(() => fired++);
        expect(fired).to.eql(0);
        await res;
        expect(fired).to.eql(1);
        expect(calcDiff(startedAt)).to.be.closeTo(0, 10); // NB: closer to zero.
        expect(res.is).to.eql({ cancelled: false, completed: true, done: true });
        expect(res.timeout).to.eql(0);
      });

      describe('bad time', () => {
        for (const bad of [-5, NaN, Infinity, 2.9]) {
          it(`normalizes timeout: ${bad}`, async () => {
            let fired = 0;
            const res = Time.delay(bad as number, () => fired++);
            await res;
            expect(res.timeout).to.eql(0, `bad time: ${bad}`);
            expect(fired).to.eql(1);
          });
        }
      });
    });

    describe('cancel', () => {
      it('cancels the timeout', async () => {
        let fired = 0;
        const res = Time.delay(5, () => fired++);
        res.cancel();

        await Testing.wait(20);
        expect(fired).to.eql(0); // NB: not fired.
        expect(res.is).to.eql({ cancelled: true, completed: false, done: true });
      });

      it('cancel() is idempotent and harmless after completion', async () => {
        const res = Time.delay(1);
        res.cancel();
        res.cancel();
        await res;

        // After settle:
        res.cancel();
        expect(res.is.done).to.eql(true);
      });

      it('micro: cancel before microtask executes', async () => {
        let fired = 0;
        const res = Time.delay(() => fired++);
        res.cancel();
        await res;
        expect(fired).to.eql(0);
        expect(res.is).to.eql({ cancelled: true, completed: false, done: true });
      });

      it('cancel resolves (does not reject)', async () => {
        const res = Time.delay(10, () => {}); /* no-op */
        res.cancel();
        await res; // NB: will throw if it rejects.
        expect(res.is).to.eql({ cancelled: true, completed: false, done: true });
      });
    });

    describe('error propogation', () => {
      it('rejects if callback throws (macro)', async () => {
        const err = new Error('boom');
        const res = Time.delay(1, () => {
          throw err;
        });

        try {
          await res;
          expect.fail('expected promise to reject');
        } catch (e) {
          expect((e as Error).message).to.eql('boom');
          expect(res.is.done).to.eql(true);
          expect(res.is.completed).to.eql(false);
          expect(res.is.cancelled).to.eql(false);
        }
      });

      it('rejects if callback throws (micro)', async () => {
        const err = new Error('boom');
        const res = Time.delay(() => {
          throw err;
        });

        try {
          await res;
          expect.fail('expected promise to reject');
        } catch (e) {
          const msg = (e as Error)?.message ?? String(e);
          expect(msg).to.eql('boom');
          expect(res.is.done).to.eql(true);
          expect(res.is.completed).to.eql(false);
          expect(res.is.cancelled).to.eql(false);
        }
      });
    });

    describe('races', () => {
      it('race: cancel right before timer fires', async () => {
        let fired = 0;
        const res = Time.delay(5, () => fired++);
        // Busy-wait tiny window:
        await Time.wait(4);
        res.cancel();
        await Time.wait(20);
        expect(fired).to.eql(0);
        expect(res.is).to.eql({ cancelled: true, completed: false, done: true });
      });

      it('race: dispose Time.until right before scheduled run', async () => {
        const { dispose, dispose$ } = Rx.disposable();
        let fired = 0;
        const time = Time.until(dispose$);
        const res = time.delay(5, () => fired++);
        await Time.wait(4);
        dispose();
        await res;
        expect(fired).to.eql(0);
        expect(time.disposed).to.eql(true);
      });
    });
  });

  describe('Time.wait', () => {
    it('Time.wait( n ) ← number/msecs param (macro-task queue)', async () => {
      const startedAt = new Date();
      expect(calcDiff(startedAt)).to.be.closeTo(0, 10);

      const res = Time.wait(15);
      await res;

      expect(res.timeout).to.eql(15);
      expect(calcDiff(startedAt)).to.be.greaterThan(14);
      expect(res.is).to.eql({ completed: true, cancelled: false, done: true });
    });

    it('Time.wait() ← no param (micro-task, aka. "tick")', async () => {
      await Testing.retry(3, async () => {
        const timer = Time.timer();
        let microtaskResolved = false;
        let macrotaskResolved = false;

        const stop = setTimeout(() => (macrotaskResolved = true), 0); // ← Schedule a macro-task for comparison.
        const res = Time.wait(); //                                      ← the micro-task delay (no param).
        await res;

        const elapsed = timer.elapsed.msec;
        microtaskResolved = true;

        expect(res.is.done).to.eql(true);
        expect(res.is.completed).to.eql(true);
        expect(res.is.cancelled).to.eql(false);

        expect(microtaskResolved).to.be.true;
        expect(macrotaskResolved).to.be.false; // Microtasks should run before macrotasks.
        expect(elapsed).to.be.closeTo(0, 2); // Allow up to 2ms tolerance.

        clearTimeout(stop);
      });
    });

    it('Time.wait → cancel', () => {
      const startedAt = new Date();
      const res = Time.wait(15);
      res.cancel();
      expect(calcDiff(startedAt)).to.be.closeTo(0, 5); // NB: cancel stops the delay.
      expect(res.is).to.eql({ completed: false, cancelled: true, done: true });
    });

    it('NB: microtask ← via Promise', async () => {
      await Promise.resolve();
    });
  });

  describe('Time.until', () => {
    const now = () => new Date().getTime();

    describe('delay', () => {
      it('Time.until: completes ← (aka. not disposed)', async () => {
        const { dispose$ } = Rx.disposable();
        const startedAt = now();

        let disposeFired = 0;
        let count = 0;
        const time = Time.until(dispose$);
        time.dispose$.subscribe(() => disposeFired++);

        expect(now() - startedAt).to.be.lessThan(8);
        await time.delay(10, () => (count += 1));

        expect(now() - startedAt).to.be.greaterThan(8);
        expect(count).to.eql(1);
        expect(disposeFired).to.eql(0);
        expect(time.disposed).to.eql(false);
      });

      it('Time.until: does not complete ← (disposed$)', async () => {
        const { dispose, dispose$ } = Rx.disposable();

        let disposeFired = 0;
        let count = 0;
        const time = Time.until(dispose$);
        time.dispose$.subscribe(() => disposeFired++);
        expect(time.disposed).to.eql(false);

        const res = time.delay(10, () => (count += 1));
        dispose();

        await res;
        await Time.wait(20);
        expect(count).to.eql(0);
        expect(time.disposed).to.eql(true);
        expect(disposeFired).to.eql(1);
      });

      it('Time.until: is a disposable', async () => {
        let disposeFired = 0;
        let count = 0;
        const time = Time.until();
        time.dispose$.subscribe(() => disposeFired++);
        expect(time.disposed).to.eql(false);

        const res = time.delay(10, () => (count += 1));
        time.dispose();

        await res;
        await Time.wait(20);
        expect(count).to.eql(0);
        expect(time.disposed).to.eql(true);
        expect(disposeFired).to.eql(1);
      });

      it('Time.until: micro path obeys disposal', async () => {
        const { dispose, dispose$ } = Rx.disposable();
        let fired = 0;
        const time = Time.until(dispose$);
        const p = time.delay(() => fired++);
        dispose();
        await p;
        expect(fired).to.eql(0);
      });
    });
  });
});
