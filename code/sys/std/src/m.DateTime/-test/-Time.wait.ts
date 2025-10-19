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
      expect(timer.is.cancelled).to.be.true;
    });

    it('defaults to a microtask tick when no msecs provided', async () => {
      let ran = false;
      await Time.wait().then(() => (ran = true));
      expect(ran).to.be.true;
    });
  });

  describe('Time.waitFor', () => {
    it('resolves once the predicate becomes truthy', async () => {
      let value = false;
      setTimeout(() => (value = true), 50);

      const result = await Time.waitFor(() => value);
      expect(result).to.be.true;
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
      expect(err?.message).to.match(/timeout/i);
      expect(elapsed).to.be.greaterThanOrEqual(90);
    });

    it('has correct type signature', () => {
      // exact structural equality against the public type
      expectTypeOf(Time.waitFor).toEqualTypeOf<t.TimeLib['waitFor']>();

      // Explicit function shape:
      type WaitForShape = <T>(
        fn: () => T | Promise<T>,
        options?: { readonly interval?: number; readonly timeout?: number },
      ) => Promise<T>;
      expectTypeOf(Time.waitFor).toEqualTypeOf<WaitForShape>();
    });
  });
});
