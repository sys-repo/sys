import { describe, expect, it } from '../-test.ts';
import { Delete } from './mod.ts';

describe('Delete', () => {
  describe('Delete.undefined', () => {
    it('retains existing values, removes undefined', () => {
      const res = Delete.undefined({
        nothing: undefined,
        yes: true,
        no: false,
        zero: 0,
        value: null,
        text: '',
      });

      expect(res).to.eql({
        yes: true,
        no: false,
        zero: 0,
        value: null,
        text: '',
      });
    });
  });

  describe('Delete.empty', () => {
    it('deletes empty/undefined values', () => {
      const res = Delete.empty({
        nothing: undefined,
        yes: true,
        no: false,
        zero: 0,
        value: null,
        text: '',
      });
      expect(res).to.eql({
        yes: true,
        no: false,
        zero: 0,
        value: null,
      });
    });
  });

  describe('Delete.fields', () => {
    type Foo = {
      a: number;
      b?: number;
      c: string;
    };

    it('removes a required key', () => {
      type T = { b?: number; c: string }; // NB sample of safe type-casting after the fact.
      const input: Foo = { a: 1, b: 2, c: 'x' };

      const res = Delete.fields(input, 'a') satisfies T;
      expect(res).to.eql({ b: 2, c: 'x' });
      expect(input).to.eql({ a: 1, b: 2, c: 'x' }); // NB: original is not mutated.

      // @ts-expect-error a should not exist on result:
      const _a: number = res.a;
    });

    it('removes an optional key', () => {
      const input: Foo = { a: 1, c: 'x' };

      const res = Delete.fields(input, 'b');
      expect(res).to.eql({ a: 1, c: 'x' });

      // @ts-expect-error b should not exist on result
      const _b: number | undefined = res.b;
    });

    it('removes multiple keys (required + optional)', () => {
      const input: Foo = { a: 1, b: 2, c: 'x' };

      const res = Delete.fields(input, 'a', 'b');
      expect(res).to.eql({ c: 'x' });

      // @ts-expect-error a should not exist on result
      const _a: number = res.a;
      // @ts-expect-error b should not exist on result
      const _b: number | undefined = res.b;
    });

    it('no keys → clone (identity by value) and immutability', () => {
      const input: Foo = { a: 1, b: 2, c: 'x' };
      const res = Delete.fields(input);

      // deep-equal by value
      expect(res).to.eql(input);
      expect(res).to.not.equal(input);

      // mutate result, ensure original untouched (verifies clone)
      (res as any).c = 'y';
      expect(input.c).to.eql('x');
    });

    it('accepts a readonly tuple of keys (const args)', () => {
      const input: Foo = { a: 1, b: 2, c: 'x' } as const;
      const keys = ['a', 'b'] as const;
      const res = Delete.fields(input, ...keys);
      expect(res).to.eql({ c: 'x' });

      // @ts-expect-error a removed
      const _a = res.a;
      // @ts-expect-error b removed
      const _b = res.b;
      // still present
      const _c: string = res.c;
    });
  });

  describe('Delete.funcs', () => {
    it('removes top-level function-valued fields (shallow) and returns a clone', () => {
      const src = {
        a: 1,
        b: 'x',
        f1: () => 123,
        f2: function () {
          return 456;
        },
      };
      const out = Delete.funcs(src);

      // clone, not same reference
      expect(out).to.not.equal(src);

      // functions removed
      expect(out).to.eql({ a: 1, b: 'x' });

      // source not mutated
      expect('f1' in src).to.equal(true);
      expect('f2' in src).to.equal(true);
    });

    it('does not descend: nested object functions are preserved', () => {
      const src = {
        nested: {
          keep: true,
          fn: () => 'nested',
        },
      };
      const out = Delete.funcs(src);

      // shallow clone keeps nested object
      expect(out).to.not.equal(src);
      expect(out.nested).to.eql(src.nested);

      // nested function remains (no deep delete)
      expect(typeof out.nested.fn).to.equal('function');
    });

    it('does not modify arrays or their elements', () => {
      const fn = () => 0;
      const src = { arr: [1, fn, 3] };
      const out = Delete.funcs(src);

      expect(Array.isArray(out.arr)).to.equal(true);
      expect(out.arr.length).to.eql(3);
      expect(out.arr[0]).to.eql(1);
      expect(typeof out.arr[1]).to.equal('function');
      expect(out.arr[2]).to.eql(3);
    });

    it('preserves non-function falsy values (0, "", false, null, undefined)', () => {
      const src = {
        n: 0,
        s: '',
        b: false,
        nil: null as null | object,
        u: undefined as unknown,
        fn: () => 1,
      };
      const out = Delete.funcs(src);

      // only the function is removed
      expect(out).to.eql({ n: 0, s: '', b: false, nil: null, u: undefined });
      expect('fn' in out).to.equal(false);
    });

    it('handles empty objects safely', () => {
      const out = Delete.funcs({});
      expect(out).to.eql({});
    });
  });
});
