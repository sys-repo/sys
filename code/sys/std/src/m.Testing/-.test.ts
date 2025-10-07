import { Random } from '../m.Random/mod.ts';
import { Testing, Time, describe, expect, expectError, expectTypeOf, it } from './mod.ts';

Deno.test('Deno.test: sample (down at the test runner metal)', async (test) => {
  await test.step('eql', () => {
    expect(123).to.eql(123);
  });
});

describe('Testing', () => {
  it('exports BDD semantics', async () => {
    const { describe, it } = await import('@std/testing/bdd');
    const { afterAll, afterEach, beforeAll, beforeEach } = await import('@std/testing/bdd');

    expect(Testing.Bdd.expect).to.equal(expect);
    expect(Testing.Bdd.describe).to.equal(describe);
    expect(Testing.Bdd.it).to.equal(it);

    expect(Testing.Bdd.beforeAll).to.equal(beforeAll);
    expect(Testing.Bdd.afterAll).to.equal(afterAll);
    expect(Testing.Bdd.beforeEach).to.equal(beforeEach);
    expect(Testing.Bdd.afterEach).to.equal(afterEach);
  });

  it('randomPort', () => {
    const a = Testing.randomPort();
    const b = Testing.randomPort();

    expect(typeof a === 'number').to.be.true;
    expect(a).to.not.eql(b);
  });

  it('slug (ID)', () => {
    const id = Testing.slug();
    expect(id.length).to.eql(Random.Length.slug);
  });

  describe('expectError', () => {
    const throwError = (message: string) => {
      throw new Error(message);
    };

    it('succeeds (default message)', async () => {
      await expectError(async () => {
        await Testing.wait(0);
        throwError('Foo');
      });
    });

    it('succeeds (custom message)', async () => {
      await expectError(() => throwError('Bar'), 'Bar');
    });

    it('fails when error not thrown', async () => {
      await expectError(async () => {
        await expectError(() => null);
      });
    });
  });

  describe('retry', () => {
    it('no handler', async () => {
      await Testing.retry(3);
    });

    it('retry: repeats 3 times, then succeeds', async () => {
      let count = 0;
      await Testing.retry(3, () => {
        count++;
        if (count < 3) throw new Error(`Foo Fail-${count}!`);
      });
      expect(count).to.eql(3);
    });

    it('retry: fails (after 3 attempts)', async () => {
      let count = 0;
      try {
        await Testing.retry(3, () => {
          count++;
          throw new Error('Foo Fail');
        });
      } catch (err: any) {
        expect(err.message).to.equal('Foo Fail');
      }
      expect(count).to.eql(3);
    });
  });

  describe('until', () => {
    it('resolves once predicate becomes true', async () => {
      let n = 0;
      const pred = () => ++n >= 3; // predicate flips true on 3rd call

      await Testing.until(pred, { times: 5, delay: 1 });
      expect(n).to.be.gte(3);
    });

    it('supports async predicates', async () => {
      let n = 0;
      const pred = async () => {
        n++;
        return n >= 2;
      };

      await Testing.until(pred, { times: 5, delay: 1 });
      expect(n).to.be.gte(2);
    });

    it('rejects if condition never met', async () => {
      let n = 0;
      const pred = () => {
        n++;
        return false;
      };

      let err: Error | undefined;
      try {
        await Testing.until(pred, { times: 3, delay: 1 });
      } catch (e) {
        err = e as Error;
      }

      expect(err).to.be.instanceOf(Error);
      expect(n).to.equal(3); // tried exactly "times" times
    });
  });

  describe('wait', () => {
    it('milliseconds (macro-task queue)', async () => {
      const timer = Time.timer();
      await Testing.wait(10);
      expect(timer.elapsed.msec).to.be.above(9);
    });

    it('no param (micro-task queue) ← "tick"', async () => {
      await Testing.retry(3, async () => {
        const timer = Time.timer();
        let microtaskResolved = false;
        let macrotaskResolved = false;

        const stop = setTimeout(() => (macrotaskResolved = true), 0); // ← Schedule a macro-task for comparison.
        await Testing.wait(); //                            ← the micro-task delay.

        const elapsed = timer.elapsed.msec;
        microtaskResolved = true;

        expect(microtaskResolved).to.be.true;
        expect(macrotaskResolved).to.be.false; // Microtasks should run before macrotasks.
        expect(elapsed).to.be.lessThan(10); // Should be ~0ms or very close (NB: allow tiny scheduler jitter).

        clearTimeout(stop);
      });
    });
  });

  describe('expectTypeOf → toEqualTypeOf', () => {
    it('accepts identical literal types', () => {
      const val = 42 as const;
      expectTypeOf(val).toEqualTypeOf<42>(); // ✅
    });

    it('accepts widened (assignable) types', () => {
      const val = 42; // number
      expectTypeOf(val).toEqualTypeOf<number>(); // ✅
    });

    it('rejects mismatched types (compile-time)', () => {
      const val = { foo: 'bar' } as const;

      // @ts-expect-error literal vs. broader string
      expectTypeOf(val.foo).toEqualTypeOf<string>();

      // @ts-expect-error structure mismatch
      expectTypeOf(val).toEqualTypeOf<{ bar: string }>();
    });

    it('works with generics', () => {
      function id<T>(x: T) {
        expectTypeOf(x).toEqualTypeOf<T>(); // ✅
        return x;
      }
      id('hello');
      id({ ok: true });
    });
  });
});
