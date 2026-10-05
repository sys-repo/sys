import { describe, expect, expectTypeOf, it } from '../../-test.ts';
import { Ratio } from '../m.Ratio.ts';
import { Num } from '../mod.ts';

describe('Num.Ratio', () => {
  describe('parse', () => {
    it('parses "16/9" → 1.777', () => {
      const n = Ratio.parse('16/9');
      expect(n).to.be.a('number');
      expect(n!).to.be.closeTo(16 / 9, 1e-12);
    });

    it('parses with spaces: "4 / 3"', () => {
      const n = Ratio.parse('4 / 3');
      expect(n!).to.be.closeTo(4 / 3, 1e-12);
    });

    it('passes through a number', () => {
      const n = Ratio.parse(1.5);
      expect(n).to.equal(1.5);
    });

    it('invalid inputs → undefined', () => {
      expect(Ratio.parse(undefined)).to.equal(undefined);
      expect(Ratio.parse('foo')).to.equal(undefined);
      expect(Ratio.parse('1/0')).to.equal(undefined);
      expect(Ratio.parse('0/3')).to.equal(undefined); // non-positive
      expect(Ratio.parse(-1)).to.equal(undefined);
      expect(Ratio.parse(' -2 / 3 ')).to.equal(undefined);
      expect(Ratio.parse({} as unknown as string)).to.equal(undefined);
    });

    it('type: parse returns number | undefined', () => {
      expectTypeOf(Ratio.parse('1/2')).toEqualTypeOf<number | undefined>();
    });
  });

  describe('toFraction', () => {
    const asNumber = (value: unknown): number => value as number;
    const closestFraction = (value: number, maxDenominator: number) => {
      let best = { num: 1, den: 1 };

      for (let den = 1; den <= maxDenominator; den++) {
        for (let num = 1; num <= 64; num++) {
          const candidate = { num, den };
          const candidateError = Math.abs(value - candidate.num / candidate.den);
          const bestError = Math.abs(value - best.num / best.den);
          const isCloser = candidateError < bestError;
          const isTie = candidateError === bestError;
          const isCanonicalTie = candidate.den < best.den ||
            (candidate.den === best.den && candidate.num < best.num);

          if (isCloser || (isTie && isCanonicalTie)) best = candidate;
        }
      }

      return best;
    };

    it('returns common reduced ratios', () => {
      expect(Ratio.toFraction(16 / 9, 32)).to.eql({ num: 16, den: 9 });
      expect(Ratio.toFraction(4 / 3, 32)).to.eql({ num: 4, den: 3 });
      expect(Ratio.toFraction(2, 32)).to.eql({ num: 2, den: 1 });
    });

    it('matches an exhaustive small-bound oracle', () => {
      const values = [0.01, 0.1, 0.5, 0.75, 1.2, Math.SQRT2, 16 / 9, Math.PI, 5.25];

      for (const value of values) {
        for (let maxDenominator = 1; maxDenominator <= 8; maxDenominator++) {
          expect(Ratio.toFraction(value, maxDenominator)).to.eql(
            closestFraction(value, maxDenominator),
          );
        }
      }
    });

    it('selects 1/30 as the closest fraction for 0.0339 with denominator 32', () => {
      expect(Ratio.toFraction(0.0339, 32)).to.eql({ num: 1, den: 30 });
    });

    it('uses denominator then numerator to break equal-error ties', () => {
      expect(Ratio.toFraction(0.75, 2)).to.eql({ num: 1, den: 1 });
      expect(Ratio.toFraction(1.5, 1)).to.eql({ num: 1, den: 1 });
    });

    it('returns safe positive pairs for tiny and large finite ratios', () => {
      const ratios = [Number.MIN_VALUE, Number.MAX_SAFE_INTEGER + 1, Number.MAX_VALUE];

      for (const ratio of ratios) {
        const fraction = Ratio.toFraction(ratio, 32);
        expect(fraction).to.not.equal(undefined);
        expect(Num.Is.safeInt(fraction!.num)).to.eql(true);
        expect(Num.Is.safeInt(fraction!.den)).to.eql(true);
        expect(fraction!.num).to.be.greaterThan(0);
        expect(fraction!.den).to.be.greaterThan(0);
      }

      expect(Ratio.toFraction(Number.MIN_VALUE, 32)).to.eql({ num: 1, den: 32 });
      expect(Ratio.toFraction(Number.MAX_SAFE_INTEGER + 1, 32)).to.eql({
        num: Number.MAX_SAFE_INTEGER,
        den: 1,
      });
    });

    it('rejects invalid runtime ratios and denominator bounds', () => {
      const invalidRatios = [
        undefined,
        Number.NaN,
        Number.NEGATIVE_INFINITY,
        Number.POSITIVE_INFINITY,
        0,
        -1,
        '1',
      ];
      const invalidDenominators = [
        0,
        -1,
        1.5,
        Number.NaN,
        Number.POSITIVE_INFINITY,
        Number.MAX_SAFE_INTEGER + 1,
        null,
        '2',
      ];

      for (const value of invalidRatios) {
        expect(Ratio.toFraction(asNumber(value))).to.equal(undefined);
      }

      for (const maxDenominator of invalidDenominators) {
        expect(Ratio.toFraction(1.5, asNumber(maxDenominator))).to.equal(undefined);
      }
    });

    it('handles the maximum safe denominator without a linear scan', () => {
      const fraction = Ratio.toFraction(Math.PI, Number.MAX_SAFE_INTEGER);

      expect(fraction).to.not.equal(undefined);
      expect(Num.Is.safeInt(fraction!.num)).to.eql(true);
      expect(Num.Is.safeInt(fraction!.den)).to.eql(true);
      expect(fraction!.den).to.be.at.most(Number.MAX_SAFE_INTEGER);
    });

    it('keeps the lowest-denominator zero-error convergent at the maximum bound', () => {
      expect(Ratio.toFraction(16 / 9, Number.MAX_SAFE_INTEGER)).to.eql({ num: 16, den: 9 });
      expect(Ratio.toFraction(Math.PI, Number.MAX_SAFE_INTEGER)).to.eql({
        num: 245_850_922,
        den: 78_256_779,
      });
    });

    it('does not narrow ratios beyond signed 32-bit magnitude', () => {
      const ratio = (2 ** 32 + 1) / 3;
      expect(Ratio.toFraction(ratio, 3)).to.eql({ num: 2 ** 32 + 1, den: 3 });
    });

    it('type: toFraction returns {num,den} | undefined', () => {
      expectTypeOf(Ratio.toFraction(1.25)).toEqualTypeOf<
        { num: number; den: number } | undefined
      >();
    });
  });

  describe('toString', () => {
    it('formats exact fractions by default without spaces', () => {
      expect(Ratio.toString(16 / 9)).to.equal('16/9');
      expect(Ratio.toString(4 / 3)).to.equal('4/3');
      expect(Ratio.toString(2)).to.equal('2/1');
    });

    it('respects spacing option', () => {
      expect(Ratio.toString(16 / 9, { spaces: true })).to.equal('16 / 9');
    });

    it('with small maxDenominator, returns best in-range fraction (√2 ≈ 4/3 for maxDen=3)', () => {
      const s = Ratio.toString(Math.SQRT2, { maxDenominator: 3 });
      expect(s).to.equal('4/3'); // closest among 1/1, 4/3, 3/2
    });

    it('with larger maxDenominator, fraction gets closer to the real value (√2)', () => {
      const sSmall = Ratio.toString(Math.SQRT2, { maxDenominator: 5 });
      const sLarge = Ratio.toString(Math.SQRT2, { maxDenominator: 32 });

      const toVal = (str: string) => {
        const [a, b] = str.split('/').map(Number);
        return a / b;
      };

      // Ensure the larger bound yields an approximation at least as close.
      const errSmall = Math.abs(toVal(sSmall) - Math.SQRT2);
      const errLarge = Math.abs(toVal(sLarge) - Math.SQRT2);
      expect(errLarge).to.be.at.most(errSmall);
    });

    it('unknown, invalid, and non-numeric ratios → "0/1"', () => {
      expect(Ratio.toString(undefined as unknown as number)).to.equal('0/1');
      expect(Ratio.toString(Number.NaN)).to.equal('0/1');
      expect(Ratio.toString(Number.NEGATIVE_INFINITY)).to.equal('0/1');
      expect(Ratio.toString(Number.POSITIVE_INFINITY)).to.equal('0/1');
      expect(Ratio.toString(0)).to.equal('0/1');
      expect(Ratio.toString(-1)).to.equal('0/1');
      expect(Ratio.toString('1' as unknown as number)).to.equal('0/1');
    });

    it('type: toString returns string', () => {
      expectTypeOf(Ratio.toString(1.5)).toEqualTypeOf<string>();
    });

    it('honors maxError: accepts fraction when within threshold', () => {
      // √2 ≈ 1.41421356… Best with maxDen=5 is 7/5 = 1.4 (err ≈ 0.0142)
      // Set maxError above err → keep fraction.
      const s = Ratio.toString(Math.SQRT2, { maxDenominator: 5, maxError: 0.02 });
      expect(s).to.equal('7/5');
    });

    it('honors maxError: falls back to decimal when fraction error exceeds threshold', () => {
      // Same scenario, but with a tighter threshold → reject 7/5 and emit "1.414/1".
      const s = Ratio.toString(Math.SQRT2, { maxDenominator: 5, maxError: 0.005 });
      expect(s).to.match(/^\d+\.\d+\/1$/); // e.g. "1.414/1"
    });

    it('maxError does not affect exact matches', () => {
      // Exact 16/9 regardless of tight threshold.
      const s = Ratio.toString(16 / 9, { maxDenominator: 9, maxError: 1e-6 });
      expect(s).to.equal('16/9');
    });

    it('falls back for invalid denominator and error options', () => {
      const invalidDenominators = [
        0,
        -1,
        1.5,
        Number.NaN,
        Number.POSITIVE_INFINITY,
        Number.MAX_SAFE_INTEGER + 1,
        null,
        '2',
      ];

      for (const maxDenominator of invalidDenominators) {
        expect(Ratio.toString(16 / 9, { maxDenominator: maxDenominator as number })).to.equal(
          '1.778/1',
        );
      }

      expect(Ratio.toString(16 / 9, { maxDenominator: 0, spaces: true })).to.equal(
        '1.778 / 1',
      );

      const invalidErrors = [Number.NaN, Number.POSITIVE_INFINITY, -1, '0.02'];
      for (const maxError of invalidErrors) {
        expect(Ratio.toString(Math.SQRT2, { maxDenominator: 5, maxError: maxError as number })).to
          .equal(
            '1.414/1',
          );
      }
    });

    it('keeps decimal fallback finite for finite inputs', () => {
      const text = Ratio.toString(Number.MAX_VALUE, { maxDenominator: 32, maxError: 0 });
      const [numerator, denominator] = text.split('/');

      expect(Number(numerator)).to.equal(Number.MAX_VALUE);
      expect(denominator).to.equal('1');
    });
  });
});
