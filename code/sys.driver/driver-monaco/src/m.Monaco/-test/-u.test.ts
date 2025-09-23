import { type t, describe, expect, it } from '../../-test.ts';
import { Util } from '../u.ts';

type IRange = t.Monaco.I.IRange;

const R = (sL: number, sC: number, eL: number, eC: number): IRange => ({
  startLineNumber: sL,
  startColumn: sC,
  endLineNumber: eL,
  endColumn: eC,
});

describe('Monaco utils', () => {
  describe('Range.eql', () => {
    const eql = Util.Range.eql;

    it('single: equal when all fields match', () => {
      const a = R(1, 1, 1, 5);
      const b = R(1, 1, 1, 5);
      expect(eql(a, b)).to.equal(true);
    });

    it('single: not equal when any field differs', () => {
      expect(eql(R(1, 1, 1, 5), R(1, 1, 1, 6))).to.equal(false);
      expect(eql(R(1, 1, 2, 1), R(1, 1, 1, 1))).to.equal(false);
      expect(eql(R(2, 1, 2, 5), R(1, 1, 2, 5))).to.equal(false);
      expect(eql(R(1, 2, 1, 5), R(1, 1, 1, 5))).to.equal(false);
    });

    it('array: equal with same ranges in same order', () => {
      const a = [R(1, 1, 1, 5), R(2, 1, 2, 4)];
      const b = [R(1, 1, 1, 5), R(2, 1, 2, 4)];
      expect(eql(a, b)).to.equal(true);
    });

    it('array: not equal when order differs', () => {
      const a = [R(1, 1, 1, 5), R(2, 1, 2, 4)];
      const b = [R(2, 1, 2, 4), R(1, 1, 1, 5)];
      expect(eql(a, b)).to.equal(false);
    });

    it('array: not equal when any element differs', () => {
      const a = [R(1, 1, 1, 5), R(2, 1, 2, 4)];
      const b = [R(1, 1, 1, 5), R(2, 1, 2, 5)];
      expect(eql(a, b)).to.equal(false);
    });

    it('array: not equal for different lengths', () => {
      const a = [R(1, 1, 1, 5)];
      const b = [R(1, 1, 1, 5), R(2, 1, 2, 4)];
      expect(eql(a, b)).to.equal(false);
    });

    it('array: equal for two empty arrays', () => {
      expect(eql([], [])).to.equal(true);
    });

    it('mismatched kinds: array vs single → false', () => {
      expect(eql(R(1, 1, 1, 5), [R(1, 1, 1, 5)])).to.equal(false);
      expect(eql([R(1, 1, 1, 5)], R(1, 1, 1, 5))).to.equal(false);
    });

    it('reference-equal arrays are equal (trivial sanity)', () => {
      const a = [R(3, 1, 3, 9)];
      const ref = a;
      expect(eql(a, ref)).to.equal(true);
    });
  });
});
