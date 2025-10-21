import { describe, expect, expectTypeOf, it } from '../../-test.ts';
import { Ratio } from '../m.Ratio.ts';

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
    });

    it('type: parse returns number | undefined', () => {
      expectTypeOf(Ratio.parse('1/2')).toEqualTypeOf<number | undefined>();
    });
  });

  describe('toFraction', () => {
    it('common ratios', () => {
      const r1 = Ratio.toFraction(16 / 9, 32);
      expect(r1).to.eql({ num: 16, den: 9 });

      const r2 = Ratio.toFraction(4 / 3, 32);
      expect(r2).to.eql({ num: 4, den: 3 });

      const r3 = Ratio.toFraction(2.0, 32);
      expect(r3).to.eql({ num: 2, den: 1 });
    });

    it('π approximates to 22/7 when maxDenominator=32', () => {
      const f = Ratio.toFraction(Math.PI, 32);
      expect(f).to.eql({ num: 22, den: 7 });
      expect(22 / 7).to.be.closeTo(Math.PI, 0.002);
    });

    it('undefined/NaN/≤0 → undefined', () => {
      expect(Ratio.toFraction(undefined as unknown as number)).to.equal(undefined);
      expect(Ratio.toFraction(NaN)).to.equal(undefined);
      expect(Ratio.toFraction(0)).to.equal(undefined);
      expect(Ratio.toFraction(-1)).to.equal(undefined);
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

    it('unknown or invalid → "0/1"', () => {
      expect(Ratio.toString(undefined as unknown as number)).to.equal('0/1');
      expect(Ratio.toString(NaN)).to.equal('0/1');
      expect(Ratio.toString(0)).to.equal('0/1');
      expect(Ratio.toString(-1)).to.equal('0/1');
    });

    it('type: toString returns string', () => {
      expectTypeOf(Ratio.toString(1.5)).toEqualTypeOf<string>();
    });
  });
});
