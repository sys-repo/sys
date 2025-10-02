import { Testing, describe, expect, it } from '../../-test.ts';
import { Rx } from '../../m.Rx/mod.ts';
import { Time } from '../mod.ts';

describe('Time Delay/Wait', () => {
  const calcDiff = (a: Date, b: Date = new Date()) => b.getTime() - a.getTime();

  describe('Time.delay', () => {
    it('response structure: <TimeDelayPromise>', () => {
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
        await Testing.retry(3, async () => {
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

    describe('options / abort', () => {
      it('macro: AbortSignal aborts → resolves by default (callback not called)', async () => {
        const ctrl = new AbortController();
        let fired = 0;
        const res = Time.delay(25, () => fired++, ctrl.signal);
        ctrl.abort(); // default is "resolve on cancel"
        await res;
        expect(fired).to.eql(0);
        expect(res.is).to.eql({ cancelled: true, completed: false, done: true });
      });

      it('macro: AbortController as options input (loose) aborts → resolves', async () => {
        const ctrl = new AbortController();
        let fired = 0;
        const res = Time.delay(10, () => fired++, ctrl); // passing controller directly
        ctrl.abort();
        await res;
        expect(fired).to.eql(0);
        expect(res.is.cancelled).to.eql(true);
      });

      it('micro: AbortSignal aborts a tick → resolves by default', async () => {
        const ctrl = new AbortController();
        let fired = 0;
        const res = Time.delay(() => fired++, ctrl.signal);
        ctrl.abort();
        await res;
        expect(fired).to.eql(0);
        expect(res.is).to.eql({ cancelled: true, completed: false, done: true });
        expect(res.timeout).to.eql(0);
      });

      it('micro: already-aborted signal → short-circuits immediately', async () => {
        const ctrl = new AbortController();
        ctrl.abort();
        let fired = 0;
        const start = new Date();
        const res = Time.delay(() => fired++, { signal: ctrl.signal });
        await res;
        const elapsed = new Date().getTime() - start.getTime();
        expect(elapsed).to.be.closeTo(0, 5);
        expect(fired).to.eql(0);
        expect(res.is.cancelled).to.eql(true);
      });

      it('cancel() with default options resolves (legacy behavior preserved)', async () => {
        const res = Time.delay(50);
        res.cancel();
        await res;
        expect(res.is).to.eql({ cancelled: true, completed: false, done: true });
      });

      it('priority: abort then cancel → single settle, still cancelled', async () => {
        const ctrl = new AbortController();
        const res = Time.delay(20, undefined, { signal: ctrl.signal });
        ctrl.abort();
        res.cancel(); // idempotent after abort
        await res;
        expect(res.is.cancelled).to.eql(true);
      });

      it('priority: cancel then abort → single settle, still cancelled', async () => {
        const ctrl = new AbortController();
        const res = Time.delay(20, undefined, { signal: ctrl.signal });
        res.cancel();
        ctrl.abort(); // idempotent after cancel
        await res;
        expect(res.is.cancelled).to.eql(true);
      });

      it('race: abort right before macro fires → callback not called; cancelled=true', async () => {
        const ctrl = new AbortController();
        let fired = 0;
        const res = Time.delay(6, () => fired++, { signal: ctrl.signal });
        await Time.wait(5);
        ctrl.abort();
        await Time.wait(20);
        expect(fired).to.eql(0);
        expect(res.is).to.eql({ cancelled: true, completed: false, done: true });
      });

      it('micro overload shapes: delay(options) and delay(fn, options)', async () => {
        // delay(options)
        {
          const ctrl = new AbortController();
          const res = Time.delay({ signal: ctrl.signal });
          ctrl.abort();
          await res;
          expect(res.is.cancelled).to.eql(true);
          expect(res.timeout).to.eql(0);
        }

        // delay(fn, options)
        {
          const ctrl = new AbortController();
          let fired = 0;
          const res = Time.delay(() => fired++, { signal: ctrl.signal });
          await res; // no abort: should run to completion
          expect(fired).to.eql(1);
          expect(res.is.completed).to.eql(true);
        }
      });

      it('macro overload with options in third position: delay(ms, fn, options)', async () => {
        const ctrl = new AbortController();
        let fired = 0;
        const res = Time.delay(15, () => fired++, { signal: ctrl.signal });
        ctrl.abort();
        await res;
        expect(fired).to.eql(0);
        expect(res.is.cancelled).to.eql(true);
      });

      it('settled promise ignores further abort/cancel (listener cleanup sanity)', async () => {
        const ctrl = new AbortController();
        const res = Time.delay(0, () => {});
        await res; //     settled completed
        ctrl.abort(); //  late abort should be ignored
        res.cancel(); //  late cancel should be ignored
        expect(res.is.done).to.eql(true);
        expect(res.is.completed || res.is.cancelled).to.eql(true);
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
