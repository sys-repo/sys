import { describe, expect, expectTypeOf, it } from '../-test.ts';
import { Fn } from './mod.ts';

describe(`Fn`, () => {
  it('API', async () => {
    const m = await import('@sys/std');
    expect(m.Fn).to.eql(Fn);
  });

  describe('Fn.onceOnly', () => {
    it('value: runs once and caches', () => {
      let n = 0;
      const f = Fn.onceOnly(() => ++n);
      expect(f()).to.eql(1);
      expect(f()).to.eql(1);
      expect(n).to.eql(1);
    });

    it('void: runs once, returns void', () => {
      let hits = 0;
      const f = Fn.onceOnly(() => void hits++);
      f();
      f();
      f();
      expect(hits).to.eql(1);
      const r = f(); // typed void
      expect(r).to.eql(undefined);
    });

    it('promise: deduplicates', async () => {
      let calls = 0;
      const f = Fn.onceOnly(async (x: number) => {
        calls++;
        return x * 2;
      });
      const [a, b] = await Promise.all([f(2), f(999)]);
      expect(a).to.eql(4);
      expect(b).to.eql(4);
      expect(calls).to.eql(1);
    });
  });

  describe('stress + edge cases', () => {
    it('concurrent: many callers share the same Promise', async () => {
      let calls = 0;
      const f = Fn.onceOnly(async (x: number) => {
        calls++;
        // simulate async work
        await new Promise((r) => setTimeout(r, 5));
        return x * 2;
      });

      const N = 50;
      const inputs = Array.from({ length: N }, (_, i) => i + 1);
      const results = await Promise.all(inputs.map((n) => f(n)));

      // All calls resolve to the first-call result (x=1) doubled
      expect(new Set(results).size).to.eql(1);
      expect(results[0]).to.eql(2);
      // Under once semantics, the underlying function runs exactly once
      expect(calls).to.eql(1);
    });

    it('sync throw on first call does NOT lock the wrapper; next call can succeed', () => {
      let n = 0;
      const f = Fn.onceOnly(() => {
        if (n++ === 0) throw new Error('boom');
        return 'ok';
      });

      // First call throws
      expect(() => f()).to.throw('boom');

      // Next call succeeds and caches
      expect(f()).to.eql('ok');
      expect(f()).to.eql('ok');
    });

    it('type inference: params and return are preserved', () => {
      type G = (a: number, b: string) => { a: number; b: string };
      const g: G = (a, b) => ({ a, b });
      const f = Fn.onceOnly(g);

      // compile-time checks (purely type-level; zero runtime):
      expectTypeOf<typeof f>(f).toEqualTypeOf<G>();
      expectTypeOf<Parameters<typeof f>>([] as unknown as Parameters<typeof f>).toEqualTypeOf<
        [number, string]
      >();
      expectTypeOf<ReturnType<typeof f>>({} as unknown as ReturnType<typeof f>).toEqualTypeOf<{
        a: number;
        b: string;
      }>();

      // runtime sanity
      expect(f(1, 'x')).to.eql({ a: 1, b: 'x' });
      expect(f(999, 'ignored')).to.eql({ a: 1, b: 'x' });
    });

    it('first-call args win; later args are ignored by design (cached result)', () => {
      const f = Fn.onceOnly((x: number) => x);
      expect(f(42)).to.eql(42);
      expect(f(7)).to.eql(42);
    });

    it('lazy: fn is not executed until first call', () => {
      let executed = false;
      const f = Fn.onceOnly(() => {
        executed = true;
        return 123;
      });
      expect(executed).to.eql(false);
      expect(f()).to.eql(123);
      expect(executed).to.eql(true);
    });
  });
});
