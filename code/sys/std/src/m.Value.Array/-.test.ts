import { describe, expect, it } from '../-test.ts';
import { Time, Value, asArray } from '../mod.ts';

describe('Value.Array', () => {
  describe('Array.flatten', () => {
    it('makes no change', () => {
      expect(Value.Array.flatten([1, 2, 3])).to.eql([1, 2, 3]);
    });

    it('return input value if an array is not passed', () => {
      expect(Value.Array.flatten(123)).to.eql(123);
    });

    it('flattens one level deep', () => {
      expect(Value.Array.flatten([1, [2, 3]])).to.eql([1, 2, 3]);
    });

    it('flattens many levels deep', () => {
      expect(Value.Array.flatten([1, [2, [3, [4, [5, 6]]]]])).to.eql([1, 2, 3, 4, 5, 6]);
    });
  });

  describe('Array.asArray', () => {
    it('same function as index', () => {
      expect(Value.Array.asArray).to.equal(asArray);
    });

    it('already array', () => {
      const input = [{ count: 1 }, { count: 2 }, { count: 3 }];
      const res = Value.Array.asArray(input);
      expect(res).to.equal(input);
      expect(res[0].count).to.eql(1); // NB: Type inferred and returned.
    });

    it('convert to array', () => {
      const input = { count: 1 };
      const res = Value.Array.asArray(input);
      expect(res.length).to.eql(1);
      expect(res).to.not.equal(input); // NB: Converted into an array
      expect(res[0]).to.equal(input);
      expect(res[0].count).to.eql(1); // NB: Type inferred and returned.
    });
  });

  describe('Array.asyncFilter', () => {
    it('filters (async)', async () => {
      const list = ['cat', 'hello cat', 'foobar'];
      const res = await Value.Array.asyncFilter(list, async (value) => {
        await Time.wait(3);
        return value.includes('cat');
      });
      expect(res).to.eql(['cat', 'hello cat']);
    });
  });

  describe('Array.page', () => {
    it('(undefined)', () => {
      const res = Value.Array.page(undefined, 1, 10);
      expect(res).to.eql([]);
    });

    it('empty', () => {
      const res = Value.Array.page([], 1, 10);
      expect(res).to.eql([]);
    });

    it('page-1, page-2', () => {
      const list = [1, 2, 3, 4, 5, 6, 7, 8];

      const page0 = Value.Array.page(list, -1, -1); // NB: out-of-range (correct to: → 0)
      const page1 = Value.Array.page(list, 0, 5);
      const page2 = Value.Array.page(list, 1, 5);
      const page3 = Value.Array.page(list, 99, 5);

      expect(page0).to.eql([]);
      expect(page1).to.eql([1, 2, 3, 4, 5]);
      expect(page2).to.eql([6, 7, 8]);
      expect(page3).to.eql([]);
    });
  });

  describe('Array.compare', () => {
    const compare = Value.Array.compare;

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
});
