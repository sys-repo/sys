import { type t, describe, expect, it } from '../-test.ts';
import { Percent } from './mod.ts';

describe('Num.Percent', () => {
  describe('clamp', () => {
    it('bad input → 0', () => {
      const test = (input: any) => {
        expect(Percent.clamp(input)).to.eql(0);
      };
      ['', '  ', 'foo', '5%%', [], {}, true].forEach(test);
    });

    it('numbers', () => {
      expect(Percent.clamp(-1)).to.eql(0);
      expect(Percent.clamp(0)).to.eql(0);
      expect(Percent.clamp(0.123)).to.eql(0.123);
      expect(Percent.clamp(1)).to.eql(1);
      expect(Percent.clamp(1.000001)).to.eql(1);
      expect(Percent.clamp(2)).to.eql(1);
    });

    it('strings', () => {
      const test = (input: string, expected: t.Percent) => {
        expect(Percent.clamp(input)).to.eql(expected);
      };
      test('', 0);
      test('  0.3  ', 0.3);
      test(' 30% ', 0.3);
      test(' 45.1% ', 0.451);
      test('0.1% ', 0.001);
    });

    it('min/max', () => {
      type T = string | number | undefined;
      const test = (input: T, min: T, max: T, expected: t.Percent) => {
        expect(Percent.clamp(input, min, max)).to.eql(expected);
      };

      test(0.5, 0.1, 0.9, 0.5);

      test(0, 0.1, 0.9, 0.1);
      test(1, 0.1, 0.9, 0.9);

      test(-1, 0.1, 0.9, 0.1);
      test(2, 0.1, 0.9, 0.9);

      test('10%', 0.25, 0.9, 0.25);
      test('60%', 0.1, 0.5, 0.5);
    });
  });

  it('isPercent', () => {
    expect(Percent.isPercent(0)).to.eql(true);
    expect(Percent.isPercent(0.123)).to.eql(true);
    expect(Percent.isPercent(1)).to.eql(true);

    expect(Percent.isPercent(-1)).to.eql(false);
    expect(Percent.isPercent(2)).to.eql(false);
  });

  it('isPixels', () => {
    expect(Percent.isPixels(-1)).to.eql(false);
    expect(Percent.isPixels(0)).to.eql(false);
    expect(Percent.isPixels(0.123)).to.eql(false);
    expect(Percent.isPixels(1)).to.eql(false);

    expect(Percent.isPixels(1.1)).to.eql(true);
    expect(Percent.isPixels(2)).to.eql(true);
  });

  it('toString', () => {
    expect(Percent.toString()).to.eql('0%');
    expect(Percent.toString(0)).to.eql('0%');
    expect(Percent.toString(0.123)).to.eql('12%');
    expect(Percent.toString(1)).to.eql('100%');
  });
});

describe('Num.Percent.Range', () => {
  type R = t.MinMaxNumberRange;
  const R1: R = [0, 200];
  const R2: R = [50, 100];

  it('round-trips value → percent → value', () => {
    const value = 135;
    const p = Percent.Range.toPercent(value, R1);
    expect(Percent.Range.fromPercent(p, R1)).to.equal(value);
  });

  describe('toPercent', () => {
    it('maps min → 0 and max → 1', () => {
      expect(Percent.Range.toPercent(R1[0], R1)).to.equal(0);
      expect(Percent.Range.toPercent(R1[1], R1)).to.equal(1);
    });

    it('maps an in-range value to the correct percent', () => {
      expect(Percent.Range.toPercent(100, R1)).to.equal(0.5);
    });

    it('clamps out-of-range inputs', () => {
      expect(Percent.Range.toPercent(-10, R1)).to.equal(0);
      expect(Percent.Range.toPercent(250, R1)).to.equal(1);
    });

    it('returns 0 when min === max (degenerate range)', () => {
      expect(Percent.Range.toPercent(42, [5, 5])).to.equal(0);
    });
  });

  describe('fromPercent', () => {
    it('maps 0 .. 1 back to the real range', () => {
      expect(Percent.Range.fromPercent(0, R2)).to.equal(50);
      expect(Percent.Range.fromPercent(1, R2)).to.equal(100);
      expect(Percent.Range.fromPercent(0.5, R2)).to.equal(75);
    });

    it('clamps percent values outside 0 … 1', () => {
      expect(Percent.Range.fromPercent(-1, R2)).to.equal(50);
      expect(Percent.Range.fromPercent(2, R2)).to.equal(100);
    });

    it('handles min === max (degenerate range)', () => {
      expect(Percent.Range.fromPercent(0.5, [5, 5])).to.equal(5);
    });
  });
});
