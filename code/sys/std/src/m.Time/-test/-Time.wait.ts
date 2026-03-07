import { type t, describe, expect, expectTypeOf, it } from '../../-test.ts';
import { Time } from '../mod.ts';

describe('waiting', () => {
  describe('Time.wait', () => {
    it('resolves after the given delay', async () => {
      const start = Date.now();
      await Time.wait(50);
      const elapsed = Date.now() - start;
      expect(elapsed).to.be.greaterThanOrEqual(45);
    });

    it('returns a cancellable delay promise', async () => {
      const timer = Time.wait(100);
      expectTypeOf(timer.cancel).toEqualTypeOf<() => void>();
      timer.cancel();

      // Internal state invariants.
      expect(timer.is.cancelled).to.eql(true);
      expect(timer.is.done).to.eql(true);
      expect(timer.is.completed).to.eql(false);
    });

    it('supports AbortSignal via options object', async () => {
      const ac = new AbortController();
      const timer = Time.wait(200, { signal: ac.signal });
      ac.abort();

      await timer; // resolves quietly
      expect(timer.is.cancelled).to.eql(true);
    });

    it('supports AbortSignal passed directly', async () => {
      const ac = new AbortController();
      const timer = Time.wait(200, ac.signal);
      ac.abort();

      await timer;
      expect(timer.is.cancelled).to.eql(true);
    });

    it('defaults to a microtask tick when no msecs provided', async () => {
      let ran = false;
      await Time.wait().then(() => (ran = true));
      expect(ran).to.eql(true);
    });

    it('has correct type signature', () => {
      expectTypeOf(Time.wait).toEqualTypeOf<t.TimeLib['wait']>();

      type WaitShape = (
        msecs?: t.Msecs,
        options?: { readonly signal?: AbortSignal } | AbortSignal,
      ) => t.TimeDelayPromise;
      expectTypeOf(Time.wait).toEqualTypeOf<WaitShape>();
    });
  });

  describe('Time.waitFor', () => {
    it('resolves once the predicate becomes truthy', async () => {
      let value = false;
      setTimeout(() => (value = true), 50);

      const result = await Time.waitFor(() => value);
      expect(result).to.eql(true);
    });

    it('passes through resolved values from async predicates', async () => {
      const result = await Time.waitFor(async () => 'done');
      expect(result).to.equal('done');
    });

    it('throws if timeout exceeded', async () => {
      const start = Date.now();
      let err: Error | undefined;

      try {
        await Time.waitFor(() => false, { timeout: 100, interval: 30 });
      } catch (e) {
        err = e as Error;
      }

      const elapsed = Date.now() - start;
      expect(err?.message.toLowerCase()).to.contain('timeout');
      expect(elapsed).to.be.greaterThanOrEqual(90);
    });

    it('has correct type signature', () => {
      expectTypeOf(Time.waitFor).toEqualTypeOf<t.TimeLib['waitFor']>();

      type WaitForShape = <T>(
        fn: () => T | Promise<T>,
        options?: { readonly interval?: number; readonly timeout?: number },
      ) => Promise<T>;

      expectTypeOf(Time.waitFor).toEqualTypeOf<WaitForShape>();
    });

    it('supports AbortSignal cancellation', async () => {
      const ac = new AbortController();
      let count = 0;
      const fn = () => {
        count++;
        return false; // never resolves truthy
      };

      const p = Time.waitFor(fn, { interval: 10, timeout: 2000, signal: ac.signal });

      // Cancel on next tick.
      queueMicrotask(() => ac.abort('stop'));
      await p; // resolves quietly

      // Ensure the function actually ran at least once.
      expect(count).to.be.greaterThan(0);
    });
  });
});
