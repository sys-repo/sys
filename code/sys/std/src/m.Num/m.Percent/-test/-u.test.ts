import { type t, describe, expect, it } from '../../../-test.ts';
import { clamp, normalize } from '../u.ts';

describe('Num.Percent.u', () => {
  describe('normalize', () => {
    it('bad input → 0', () => {
      const test = (input: any) => {
        expect(normalize(input)).to.eql(0);
      };
      [undefined, '', '  ', 'foo', '5%%', Number.NaN, [], {}, true].forEach(test);
    });

    it('numbers', () => {
      expect(normalize(-1)).to.eql(0);
      expect(normalize(0)).to.eql(0);
      expect(normalize(0.123)).to.eql(0.123);
      expect(normalize(1)).to.eql(1);
      expect(normalize(1.000001)).to.eql(1);
      expect(normalize(2)).to.eql(1);
      expect(normalize(Number.POSITIVE_INFINITY)).to.eql(1);
      expect(normalize(Number.NEGATIVE_INFINITY)).to.eql(0);
    });

    it('strings', () => {
      const test = (input: string, expected: t.Percent) => {
        expect(normalize(input)).to.eql(expected);
      };
      test('', 0);
      test('  0.3  ', 0.3);
      test(' 30% ', 0.3);
      test(' 45.1% ', 0.451);
      test('0.1% ', 0.001);
    });
  });

  describe('clamp', () => {
    it('normalizes without bounds', () => {
      expect(clamp('30%')).to.eql(0.3);
      expect(clamp(Number.NaN)).to.eql(0);
    });

    it('min/max', () => {
      type T = string | number | undefined;
      const test = (input: T, min: T, max: T, expected: t.Percent) => {
        expect(clamp(input, min, max)).to.eql(expected);
      };

      test(0.5, 0.1, 0.9, 0.5);
      test(0, 0.1, 0.9, 0.1);
      test(1, 0.1, 0.9, 0.9);
      test(-1, 0.1, 0.9, 0.1);
      test(2, 0.1, 0.9, 0.9);

      test(' 10% ', ' 25% ', 0.9, 0.25);
      test(' 60% ', 0.1, ' 50% ', 0.5);
    });
  });
});
