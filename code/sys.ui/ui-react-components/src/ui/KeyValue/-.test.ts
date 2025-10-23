import { type t, describe, expect, expectTypeOf, it } from '../../-test.ts';
import { KeyValue } from './mod.ts';

describe('KeyValue', () => {
  describe('KeyValue.fromObject', () => {
    it('type: returns KeyValueItem[]', () => {
      const items = KeyValue.fromObject({ a: 1 });
      expectTypeOf(items).toEqualTypeOf<t.KeyValueItem[]>();
      expect(Array.isArray(items)).to.equal(true);
    });

    it('undefined or empty object → []', () => {
      expect(KeyValue.fromObject(undefined)).to.eql([]);
      expect(KeyValue.fromObject({})).to.eql([]);
    });

    it('basic mapping (k/v)', () => {
      const items = KeyValue.fromObject({ a: 1, b: 'two', c: true });
      expect(items.map((i) => i.kind ?? 'row')).to.eql(['row', 'row', 'row']);
      expect(items.map((i) => (i as t.KeyValueRow).k)).to.eql(['a', 'b', 'c']);
      // default formatter stringifies values
      expect(items.map((i) => (i as t.KeyValueRow).v)).to.eql(['1', 'two', 'true']);
    });

    it('preserves insertion order', () => {
      const obj = { z: 0, a: 1, m: 2, b: 3 };
      const items = KeyValue.fromObject(obj);
      const keys = items.map((i) => (i as t.KeyValueRow).k);
      expect(keys).to.eql(['z', 'a', 'm', 'b']);
    });

    it('filter(key, value): include/exclude rows', () => {
      const obj = { a: 0, b: 1, c: 2, d: 3 };
      const items = KeyValue.fromObject(obj, {
        filter: (k, v) => typeof v === 'number' && (v as number) % 2 === 1,
      });
      const keys = items.map((i) => (i as t.KeyValueRow).k);
      expect(keys).to.eql(['b', 'd']);
    });

    it('format(value): custom render for values', () => {
      const obj = { a: 1, b: 'x' };
      const items = KeyValue.fromObject(obj, {
        format: (v) => `v:${String(v)}`,
      });
      expect(items.map((i) => (i as t.KeyValueRow).v)).to.eql(['v:1', 'v:x']);
    });

    it('default formatting: primitives, bigint, arrays, objects, null/undefined', () => {
      const obj = {
        s: 'str',
        n: 42,
        b: false,
        g: BigInt(123),
        a: [1, 2],
        o: { x: 1 },
        u: undefined,
        nil: null,
      };
      const items = KeyValue.fromObject(obj);
      const map = Object.fromEntries(
        items.map((i) => [(i as t.KeyValueRow).k as string, (i as t.KeyValueRow).v]),
      );

      expect(map.s).to.equal('str');
      expect(map.n).to.equal('42');
      expect(map.b).to.equal('false');
      expect(map.g).to.equal('123'); // bigint → toString()
      expect(map.a).to.equal(JSON.stringify([1, 2]));
      expect(map.o).to.equal(JSON.stringify({ x: 1 }));
      expect(map.u).to.equal('undefined');
      expect(map.nil).to.equal('null');
    });
  });
});
