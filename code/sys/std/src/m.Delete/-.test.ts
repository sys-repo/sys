import { describe, expect, it } from '../-test.ts';
import { Delete } from './mod.ts';

describe('Delete', () => {
  describe('Delete.undefined', () => {
    it('removes only undefined keys (shallow) and returns a clone', () => {
      const src = { a: 1, b: undefined, c: '', d: false };
      const out = Delete.undefined(src);
      expect(out).to.not.equal(src);
      expect(out).to.eql({ a: 1, c: '', d: false });
      expect('b' in src).to.equal(true); // source not mutated
    });

    it('does not descend into nested objects', () => {
      const src = { o: { k: undefined, v: 1 } };
      const out = Delete.undefined(src);
      expect(out.o).to.eql({ k: undefined, v: 1 });
    });

    it('keeps null (not removed)', () => {
      const src = { n: null as null | object, u: undefined as unknown };
      const out = Delete.undefined(src);
      expect(out).to.eql({ n: null });
    });
  });

  describe('Delete.empty', () => {
    it('removes keys that are undefined or "" (empty string), shallow only', () => {
      const src = { a: '', b: undefined, c: 0, d: false, e: 'x' };
      const out = Delete.empty(src);
      expect(out).to.not.equal(src);
      expect(out).to.eql({ c: 0, d: false, e: 'x' });
    });

    it('does not remove null, 0, or false', () => {
      const src = { n: null as null | object, z: 0, f: false, s: '' };
      const out = Delete.empty(src);
      expect(out).to.eql({ n: null, z: 0, f: false });
    });

    it('does not descend into nested objects', () => {
      const src = { o: { k: '', v: 1 } };
      const out = Delete.empty(src);
      expect(out.o).to.eql({ k: '', v: 1 });
    });
  });

  describe('Delete.fields', () => {
    it('removes specified keys (shallow) and returns a clone', () => {
      const src = { a: 1, b: 2, c: 3 };
      const out = Delete.fields(src, 'a', 'c' as const);
      expect(out).to.not.equal(src);
      expect(out).to.eql({ b: 2 });
      expect(src).to.eql({ a: 1, b: 2, c: 3 });
    });

    it('ignores missing keys gracefully', () => {
      const src = { a: 1 };
      const out = Delete.fields(src, 'x' as never);
      expect(out).to.eql({ a: 1 });
    });

    it('does not touch nested shapes', () => {
      const src = { keep: { a: 1 }, drop: 42 };
      const out = Delete.fields(src, 'drop' as const);
      expect(out).to.eql({ keep: { a: 1 } });
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
