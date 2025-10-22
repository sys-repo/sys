import { describe, expectTypeOf, it } from './mod.ts';

describe('expectTypeOf', () => {
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

  describe('expectTypeOf → toMatchTypeOf (assignability)', () => {
    it('primitives: literal → widened', () => {
      const lit = 42 as const;
      expectTypeOf(lit).toMatchTypeOf<number>();
    });

    it('unions: member → union', () => {
      const n: number = 1;
      expectTypeOf(n).toMatchTypeOf<number | string>();
    });

    it('never/unknown: bottom and top types', () => {
      const nvr = null as unknown as never;
      expectTypeOf(nvr).toMatchTypeOf<number>(); // never → any T
      const anyNum = 123 as number;
      expectTypeOf(anyNum).toMatchTypeOf<unknown>(); // any T → unknown
    });

    it('objects: structural subtyping (extra props allowed)', () => {
      const x = { a: 1, b: 'two' };
      expectTypeOf(x).toMatchTypeOf<{ a: number }>();
    });

    it('objects: required → optional is assignable', () => {
      const r = { a: 1 };
      expectTypeOf(r).toMatchTypeOf<{ a?: number }>();
    });

    it('readonly vs mutable (objects): mutable → readonly is assignable', () => {
      type R = { readonly a: number };
      type M = { a: number };
      const m: M = { a: 1 };
      expectTypeOf(m).toMatchTypeOf<R>();
    });

    it('arrays: mutable → readonly is assignable', () => {
      const arr: number[] = [1, 2, 3];
      expectTypeOf(arr).toMatchTypeOf<ReadonlyArray<number>>();
      expectTypeOf(arr).toMatchTypeOf<readonly number[]>();
    });

    it('promises: Promise<T> → PromiseLike<T>', () => {
      const p = Promise.resolve(1);
      expectTypeOf(p).toMatchTypeOf<PromiseLike<number>>();
    });

    it('intersections: A & B → A', () => {
      type A = { a: number };
      type B = { b: string };
      const ab: A & B = { a: 1, b: 'x' };
      expectTypeOf(ab).toMatchTypeOf<A>();
    });

    it('functions: narrower return → wider return (covariance)', () => {
      type F = () => 42;
      const f: F = () => 42 as const;
      expectTypeOf(f).toMatchTypeOf<() => number>();
    });

    /**
     * Generics note:
     * Avoid asserting `expectTypeOf(x).toMatchTypeOf<{id:string}>()` inside
     * `function f<T extends {id:string}>(x:T) { ... }`
     * because TS may not evaluate `[T] extends [U]` as true there.
     * Instead, assert using the *constraint* directly.
     */
    it('generics: value conforms to its constraint (indirect)', () => {
      function takes<T extends { id: string }>(x: T) {
        // Assert the constraint itself (does not rely on [T] extends [U] re-evaluation):
        type Constraint = { id: string };
        expectTypeOf<Constraint>(x as Constraint).toMatchTypeOf<Constraint>();
        return x;
      }
      takes({ id: 'x', extra: true });
    });

    // ---------------- Negative (compile-time) checks ----------------

    it('negative: union → member (not assignable)', () => {
      const u: number | string = Math.random() > 0.5 ? 1 : 'x';
      // @ts-expect-error number|string not assignable to number
      expectTypeOf(u).toMatchTypeOf<number>();
    });

    it('negative: missing required property', () => {
      const x = { a: 1 };
      // @ts-expect-error missing "b"
      expectTypeOf(x).toMatchTypeOf<{ a: number; b: string }>();
    });

    it('negative: readonly array → mutable array (not assignable)', () => {
      const ro: readonly number[] = [1, 2, 3] as const as readonly number[];
      // @ts-expect-error readonly array not assignable to mutable array
      expectTypeOf(ro).toMatchTypeOf<number[]>();
    });

    it('negative: optional → required (not assignable)', () => {
      const x: { a?: number } = {};
      // @ts-expect-error {a?: number} not assignable to {a: number}
      expectTypeOf(x).toMatchTypeOf<{ a: number }>();
    });
  });
});
