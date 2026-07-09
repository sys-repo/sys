import { type t, describe, expect, it } from '../../../-test.ts';
import { Range } from '../m.Range.ts';

describe('Num.Percent.Range', () => {
  type R = t.MinMaxNumberRange;
  const R1: R = [0, 200];
  const R2: R = [50, 100];

  const { toPercent, fromPercent, isRange } = Range;

  it('round-trips value → percent → value', () => {
    const value = 135;
    const p = toPercent(value, R1);
    expect(fromPercent(p, R1)).to.eql(value);
  });

  it('isRange', () => {
    expect(isRange(undefined)).to.eql(false);
    expect(isRange(['a', 5] as any)).to.eql(false);
    expect(isRange([5] as any)).to.eql(false);
    expect(isRange([] as any)).to.eql(false);

    expect(isRange([1, 3])).to.eql(true);
  });

  describe('toPercent', () => {
    it('maps min → 0 and max → 1', () => {
      expect(toPercent(R1[0], R1)).to.eql(0);
      expect(toPercent(R1[1], R1)).to.eql(1);
    });

    it('maps an in-range value to the correct percent', () => {
      expect(toPercent(100, R1)).to.eql(0.5);
    });

    it('normalizes out-of-range and NaN inputs', () => {
      expect(toPercent(-10, R1)).to.eql(0);
      expect(toPercent(250, R1)).to.eql(1);
      expect(toPercent(Number.NaN, R1)).to.eql(0);
    });

    it('returns 0 when min === max (degenerate range)', () => {
      expect(toPercent(42, [5, 5])).to.eql(0);
    });

    it('invalid range', () => {
      expect(toPercent(42, undefined as any)).to.eql(0);
      expect(toPercent(42, ['a', 5] as any)).to.eql(0);
      expect(toPercent(42, [5] as any)).to.eql(0);
      expect(toPercent(42, [] as any)).to.eql(0);
    });
  });

  describe('fromPercent', () => {
    it('maps 0..1 back to the real range', () => {
      expect(fromPercent(0, R2)).to.eql(50);
      expect(fromPercent(1, R2)).to.eql(100);
      expect(fromPercent(0.5, R2)).to.eql(75);
    });

    it('normalizes percent values outside 0..1', () => {
      expect(fromPercent(-1, R2)).to.eql(50);
      expect(fromPercent(2, R2)).to.eql(100);
      expect(fromPercent(Number.NaN, R2)).to.eql(50);
    });

    it('handles min === max (degenerate range)', () => {
      expect(fromPercent(0.5, [5, 5])).to.eql(5);
    });

    it('invalid range', () => {
      expect(fromPercent(42, undefined as any)).to.eql(0);
      expect(fromPercent(42, ['a', 5] as any)).to.eql(0);
      expect(fromPercent(42, [5] as any)).to.eql(0);
      expect(fromPercent(42, [] as any)).to.eql(0);
    });
  });
});
