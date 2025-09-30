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
});
