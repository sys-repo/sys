import { describe, expect, it } from '../-test.ts';
import { Arr, Time, Value, asArray } from '../mod.ts';

describe('Value.Arr (Array)', () => {
  it('API', async () => {
    const { Arr: Lib } = await import('./mod.ts');
    const { Arr } = await import('./m.Arr.ts');
    expect(Arr).to.equal(Lib);
    expect(Value.Arr).to.eql(Lib);
  });

  describe('Arr.flatten', () => {
    it('makes no change', () => {
      expect(Value.Arr.flatten([1, 2, 3])).to.eql([1, 2, 3]);
    });

    it('return input value if an array is not passed', () => {
      expect(Value.Arr.flatten(123)).to.eql(123);
    });

    it('flattens one level deep', () => {
      expect(Value.Arr.flatten([1, [2, 3]])).to.eql([1, 2, 3]);
    });

    it('flattens many levels deep', () => {
      expect(Value.Arr.flatten([1, [2, [3, [4, [5, 6]]]]])).to.eql([1, 2, 3, 4, 5, 6]);
    });
  });

  describe('Arr.isArray', () => {
    it('true', () => {
      expect(Arr.isArray([])).to.eql(true);
      expect(Arr.isArray([1, 'two', '🐷🐷🐷'])).to.eql(true);
    });

    it('false', () => {
      const NON = ['', 123, true, null, undefined, BigInt(0), Symbol('foo'), {}];
      NON.forEach((value: any) => expect(Arr.isArray(value)).to.eql(false));
    });
  });

  describe('Arr.asArray', () => {
    it('same function as index', () => {
      expect(Value.Arr.asArray).to.equal(asArray);
    });

    it('already array', () => {
      const input = [{ count: 1 }, { count: 2 }, { count: 3 }];
      const res = Value.Arr.asArray(input);
      expect(res).to.equal(input);
      expect(res[0].count).to.eql(1); // NB: Type inferred and returned.
    });

    it('convert to array', () => {
      const input = { count: 1 };
      const res = Value.Arr.asArray(input);
      expect(res.length).to.eql(1);
      expect(res).to.not.equal(input); // NB: Converted into an array
      expect(res[0]).to.equal(input);
      expect(res[0].count).to.eql(1); // NB: Type inferred and returned.
    });
  });

  describe('Arr.asyncFilter', () => {
    it('filters (async)', async () => {
      const list = ['cat', 'hello cat', 'foobar'];
      const res = await Value.Arr.asyncFilter(list, async (value) => {
        await Time.wait(3);
        return value.includes('cat');
      });
      expect(res).to.eql(['cat', 'hello cat']);
    });
  });

  describe('Arr.page', () => {
    it('(undefined)', () => {
      const res = Value.Arr.page(undefined, 1, 10);
      expect(res).to.eql([]);
    });

    it('empty', () => {
      const res = Value.Arr.page([], 1, 10);
      expect(res).to.eql([]);
    });

    it('page-1, page-2', () => {
      const list = [1, 2, 3, 4, 5, 6, 7, 8];

      const page0 = Value.Arr.page(list, -1, -1); // NB: out-of-range (correct to: → 0)
      const page1 = Value.Arr.page(list, 0, 5);
      const page2 = Value.Arr.page(list, 1, 5);
      const page3 = Value.Arr.page(list, 99, 5);

      expect(page0).to.eql([]);
      expect(page1).to.eql([1, 2, 3, 4, 5]);
      expect(page2).to.eql([6, 7, 8]);
      expect(page3).to.eql([]);
    });
  });

  describe('Arr.compare', () => {
    const compare = Value.Arr.compare;

    it('init', () => {
      const subject = [1, 2];
      const a = compare(subject);
      expect(a.subject).to.equal(subject);
    });

    describe('startWith', () => {
      const test = (subject: number[], startsWith: number[], expected?: boolean) => {
        expect(compare(subject).startsWith(startsWith)).to.eql(expected);
      };

      it('true', () => {
        test([1, 2, 3], [1, 2], true);
        test([1, 2, 3], [1, 2, 3], true);
      });

      it('false', () => {
        test([1, 3, 2], [1, 2], false);
        test([1, 2], [1, 2, 3], false);
      });

      it('empty', () => {
        test([], [], true);
      });
    });
  });

  describe('Arr.uniq', () => {
    it('returns an empty array for empty input', () => {
      const input: number[] = [];
      const out = Arr.uniq(input);
      expect(out).to.eql([]);
    });

    it('removes duplicate primitives and keeps original order', () => {
      const input = [1, 2, 2, 3, 1, 4];
      const out = Arr.uniq(input);
      expect(out).to.eql([1, 2, 3, 4]);
    });

    it('does not mutate the original array', () => {
      const input = ['a', 'b', 'a'];
      const copy = [...input];
      void Arr.uniq(input);
      expect(input).to.eql(copy);
    });

    it('accepts readonly input', () => {
      const tuple = [1, 2, 2] as const; // readonly [1, 2, 2].
      const out = Arr.uniq(tuple);
      expect(out).to.eql([1, 2]);
    });

    it('deduplicates by reference, not deep equality', () => {
      const a = { id: 1 };
      const b = { id: 1 }; // same shape, different reference.
      const out = Arr.uniq([a, a, b]);
      expect(out).to.eql([a, b]); // only the ref-dup removed.
    });

    it('returns a new array instance every time', () => {
      const input = [99, 99];
      const out = Arr.uniq(input);
      expect(out).to.not.equal(input);
    });
  });

  describe('Arr.sortBy', () => {
    it('sorts', () => {
      type Row = { count: number; tag?: string };

      const rows: Row[] = [
        { count: 5, tag: 'A' },
        { count: 0, tag: 'B' },
        { count: 3, tag: 'C' },
      ];

      const a = Arr.sortBy(rows, 'count');
      const b = Arr.sortBy(rows, 'count', 'desc');
      const c = Arr.sortBy(rows, 'tag');
      const d = Arr.sortBy(rows, 'tag', 'desc');

      expect(a.map((e) => e.count)).to.eql([0, 3, 5]);
      expect(b.map((e) => e.count)).to.eql([5, 3, 0]);
      expect(c.map((e) => e.tag)).to.eql(['A', 'B', 'C']);
      expect(d.map((e) => e.tag)).to.eql(['C', 'B', 'A']);
    });
  });

  describe('Arr.startsWith', () => {
    it('matches a shorter prefix at the start of the array', () => {
      expect(Arr.startsWith([1, 2, 3], [1, 2])).to.be.true;
    });

    it('matches when prefix and subject are the same length and content', () => {
      expect(Arr.startsWith(['a', 'b'], ['a', 'b'])).to.be.true;
    });

    it('fails when prefix is longer than subject', () => {
      expect(Arr.startsWith([1], [1, 2])).to.be.false;
    });

    it('fails when any element differs', () => {
      expect(Arr.startsWith([1, 2, 3], [1, 3])).to.be.false;
    });

    it('always matches an empty prefix', () => {
      expect(Arr.startsWith([1, 2, 3], [])).to.be.true;
    });

    it('compares elements with Object.is semantics (NaN / -0)', () => {
      expect(Arr.startsWith([NaN, 2], [NaN])).to.be.true; // NaN === NaN (via Object.is)
      expect(Arr.startsWith([-0, 1], [+0])).to.be.false; // -0 !== +0 (via Object.is)
    });
  });

  describe('Arr.equal (instance equality)', () => {
    it('returns true for two empty arrays', () => {
      expect(Arr.equal([], [])).to.be.true;
    });

    it('returns true for arrays with identical primitive elements', () => {
      expect(Arr.equal([1, 2, 3], [1, 2, 3])).to.be.true;
    });

    it('returns false when lengths differ', () => {
      expect(Arr.equal([1, 2], [1, 2, 3])).to.be.false;
    });

    it('returns false when elements differ at any index', () => {
      expect(Arr.equal([1, 2, 3], [1, 4, 3])).to.be.false;
    });

    it('returns true for arrays of the same object references', () => {
      const obj = { foo: 'bar' };
      expect(Arr.equal([obj, obj], [obj, obj])).to.be.true;
    });

    it('returns false for arrays of different object instances with equal structure', () => {
      expect(Arr.equal([{ foo: 'bar' }], [{ foo: 'bar' }])).to.be.false;
    });

    it('returns true for [NaN] compared to [NaN]', () => {
      expect(Arr.equal([NaN], [NaN])).to.be.true;
    });

    it('returns false for [-0] compared to [0]', () => {
      expect(Arr.equal([-0], [0])).to.be.false;
    });
  });
});
