import { type t, describe, expect, it } from '../../-test.ts';
import { D } from '../common.ts';
import { RangeUtil, Util } from '../u.ts';

type IRange = t.Monaco.I.IRange;

const R = (sL: number, sC: number, eL: number, eC: number): IRange => ({
  startLineNumber: sL,
  startColumn: sC,
  endLineNumber: eL,
  endColumn: eC,
});

describe('RangeUtil', () => {
  it('API', () => {
    expect(Util.Range).to.equal(RangeUtil);
  });

  describe('.eql', () => {
    const eql = RangeUtil.eql;

    it('single: equal when all fields match', () => {
      const a = R(1, 1, 1, 5);
      const b = R(1, 1, 1, 5);
      expect(eql(a, b)).to.eql(true);
    });

    it('single: not equal when any field differs', () => {
      expect(eql(R(1, 1, 1, 5), R(1, 1, 1, 6))).to.eql(false);
      expect(eql(R(1, 1, 2, 1), R(1, 1, 1, 1))).to.eql(false);
      expect(eql(R(2, 1, 2, 5), R(1, 1, 2, 5))).to.eql(false);
      expect(eql(R(1, 2, 1, 5), R(1, 1, 1, 5))).to.eql(false);
    });

    it('array: equal with same ranges in same order', () => {
      const a = [R(1, 1, 1, 5), R(2, 1, 2, 4)];
      const b = [R(1, 1, 1, 5), R(2, 1, 2, 4)];
      expect(eql(a, b)).to.eql(true);
    });

    it('array: not equal when order differs', () => {
      const a = [R(1, 1, 1, 5), R(2, 1, 2, 4)];
      const b = [R(2, 1, 2, 4), R(1, 1, 1, 5)];
      expect(eql(a, b)).to.eql(false);
    });

    it('array: not equal when any element differs', () => {
      const a = [R(1, 1, 1, 5), R(2, 1, 2, 4)];
      const b = [R(1, 1, 1, 5), R(2, 1, 2, 5)];
      expect(eql(a, b)).to.eql(false);
    });

    it('array: not equal for different lengths', () => {
      const a = [R(1, 1, 1, 5)];
      const b = [R(1, 1, 1, 5), R(2, 1, 2, 4)];
      expect(eql(a, b)).to.eql(false);
    });

    it('array: equal for two empty arrays', () => {
      expect(eql([], [])).to.eql(true);
    });

    it('mismatched kinds: array vs single → false', () => {
      expect(eql(R(1, 1, 1, 5), [R(1, 1, 1, 5)])).to.eql(false);
      expect(eql([R(1, 1, 1, 5)], R(1, 1, 1, 5))).to.eql(false);
    });

    it('reference-equal arrays are equal (trivial sanity)', () => {
      const a = [R(3, 1, 3, 9)];
      const ref = a;
      expect(eql(a, ref)).to.eql(true);
    });
  });

  describe('.asRange', () => {
    it('returns D.NULL_RANGE clone when input is undefined', () => {
      const NULL = D.NULL_RANGE;
      const res = RangeUtil.asRange(undefined);
      expect(res).to.eql(NULL); //        same values...
      expect(res).to.not.equal(NULL); // ...but cloned object
    });

    it('array: [sL,sC,eL,eC]', () => {
      const res = RangeUtil.asRange([1, 2, 3, 4]);
      expect(res).to.eql(R(1, 2, 3, 4));
    });

    it('array: [sL,sC] (collapsed single-point)', () => {
      const res = RangeUtil.asRange([5, 6]);
      expect(res).to.eql(R(5, 6, 5, 6));
    });

    it('object: already a Monaco range', () => {
      const obj = R(2, 3, 4, 5);
      const res = RangeUtil.asRange(obj);
      expect(res).to.eql(obj);
      expect(res).to.not.equal(obj); // cloned shape, not same ref
    });
  });

  describe('.asRanges', () => {
    it('undefined → []', () => {
      expect(RangeUtil.asRanges(undefined)).to.eql([]);
    });

    it('Editor range → [range]', () => {
      const one = R(1, 2, 3, 4);
      const res = RangeUtil.asRanges(one);
      expect(res).to.eql([one]); //     same values
      expect(res[0]).to.equal(one); //  same ref is fine for pass-through
    });

    it('CharPositionTuple → [collapsed range]', () => {
      const tup: t.CharPosTuple = [5, 6];
      const res = RangeUtil.asRanges(tup);
      expect(res).to.eql([R(5, 6, 5, 6)]);
    });

    it('[] (empty array) → []', () => {
      expect(RangeUtil.asRanges([])).to.eql([]);
    });

    it('array: mix of valid values → mapped; invalids filtered out', () => {
      const a = R(2, 3, 4, 5);
      const b: t.CharPosTuple = [7, 8];
      const invalids = [null, 0, {}, ['nope'], [1] /* bad tuple */] as unknown[];

      const input = [a, b, ...invalids] as any[];
      const res = RangeUtil.asRanges(input);

      expect(res).to.eql([a, R(7, 8, 7, 8)]);
      // first is the same object reference (pass-through), second is newly constructed
      expect(res[0]).to.equal(a);
    });

    it('array: all invalid → []', () => {
      const input = [null, {}, 123, ['x'], [1], [1, '2']] as unknown[];
      expect(RangeUtil.asRanges(input as any)).to.eql([]);
    });
  });
});
