import { describe, expect, it } from '../../-test.ts';
import { PercentRange } from '../m.Percent.Range.ts';
import { Percent } from '../m.Percent.ts';
import { Ratio } from '../m.Ratio.ts';
import { Num } from '../mod.ts';

describe('Value.Num', () => {
  it('API', () => {
    expect(Num.Percent).to.equal(Percent);
    expect(Num.Percent.Range).to.eql(PercentRange);
    expect(Num.Ratio).to.equal(Ratio);
  });

  describe('Num.round', () => {
    it('should round to no decimal places by default', () => {
      expect(Num.round(1.2345)).to.eql(1);
      expect(Num.round(1.5)).to.eql(2);
      expect(Num.round(1.4)).to.eql(1);
    });

    it('should round to the specified number of decimal places', () => {
      expect(Num.round(1.2345, 2)).to.eql(1.23);
      expect(Num.round(1.235, 2)).to.eql(1.24);
      expect(Num.round(1.2345, 3)).to.eql(1.235);
    });

    it('should handle negative precision correctly', () => {
      expect(Num.round(12345, -1)).to.eql(12350);
      expect(Num.round(12345, -2)).to.eql(12300);
    });

    it('should round negative numbers correctly', () => {
      expect(Num.round(-1.2345)).to.eql(-1);
      expect(Num.round(-1.5)).to.eql(-1);
      expect(Num.round(-1.51)).to.eql(-2);
      expect(Num.round(-1.4)).to.eql(-1);
      expect(Num.round(-1.2345, 2)).to.eql(-1.23);
    });

    it('should round zero correctly', () => {
      expect(Num.round(0)).to.eql(0);
      expect(Num.round(0.1234, 2)).to.eql(0.12);
      expect(Num.round(0, -1)).to.eql(0);
    });
  });

  describe('Num.toString', () => {
    it('returns "0" when called without arguments', () => {
      expect(Num.toString()).to.eql('0');
    });

    it('formats integer values without decimals', () => {
      expect(Num.toString(0)).to.eql('0');
      expect(Num.toString(123)).to.eql('123');
      expect(Num.toString(-456)).to.eql('-456');
    });

    it('formats values with up to the default 2 decimal places', () => {
      expect(Num.toString(1.2)).to.eql('1.2');
      expect(Num.toString(1.234)).to.eql('1.23');
      expect(Num.toString(123_456.12345)).to.eql('123,456.12');
    });

    it('respects a custom maxDecimals parameter', () => {
      expect(Num.toString(1.2345, 3)).to.eql('1.235');
      expect(Num.toString(1.2345, 1)).to.eql('1.2');
    });

    it('drops trailing zeros after the decimal', () => {
      expect(Num.toString(1.5, 2)).to.eql('1.5');
      expect(Num.toString(2.0, 3)).to.eql('2');
    });

    it('rounds correctly when maxDecimals is zero', () => {
      expect(Num.toString(1.4, 0)).to.eql('1');
      expect(Num.toString(1.5, 0)).to.eql('2');
      expect(Num.toString(-1.6, 0)).to.eql('-2');
    });

    it('rounds negative values to the correct precision', () => {
      expect(Num.toString(-1.234, 2)).to.eql('-1.23');
      expect(Num.toString(-1.235, 2)).to.eql('-1.24');
    });
  });

  describe('Num.clamp', () => {
    it('clamps values below the minimum to the minimum', () => {
      expect(Num.clamp(0, 1, -5)).to.eql(0);
    });

    it('clamps values above the maximum to the maximum', () => {
      expect(Num.clamp(0, 1, 2)).to.eql(1);
    });

    it('returns the original value when within the range', () => {
      expect(Num.clamp(0, 1, 0.5)).to.eql(0.5);
    });

    it('returns the minimum when equal to the minimum bound', () => {
      expect(Num.clamp(0, 1, 0)).to.eql(0);
    });

    it('returns the maximum when equal to the maximum bound', () => {
      expect(Num.clamp(0, 1, 1)).to.eql(1);
    });

    it('handles negative ranges', () => {
      expect(Num.clamp(-1, 1, -2)).to.eql(-1);
      expect(Num.clamp(-1, 1, 2)).to.eql(1);
      expect(Num.clamp(-1, 1, 0)).to.eql(0);
    });

    it('returns NaN if the value is NaN', () => {
      const result = Num.clamp(0, 1, NaN);
      expect(Number.isNaN(result)).to.be.true;
    });
  });

  describe('Num.toLetter', () => {
    // prettier-ignore
    const ALPHABET = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'] as const

    it('returns uppercase letters A-Z for 0-25', () => {
      const results = Array.from({ length: 26 }, (_, i) => Num.toLetter(i));
      expect(results).to.eql(ALPHABET);
    });

    it('wraps around after Z (mod 26)', () => {
      expect(Num.toLetter(26)).to.eql('A');
      expect(Num.toLetter(27)).to.eql('B');
      expect(Num.toLetter(51)).to.eql('Z');
    });

    it('handles large indexes consistently (e.g., modulo wrap)', () => {
      expect(Num.toLetter(52)).to.eql('A'); // 26×2
      expect(Num.toLetter(78)).to.eql('A'); // 26×3
      expect(Num.toLetter(79)).to.eql('B');
    });

    it('handles negative numbers by modular equivalence', () => {
      expect(Num.toLetter(-1)).to.eql('Z');
      expect(Num.toLetter(-2)).to.eql('Y');
      expect(Num.toLetter(-27)).to.eql('Z');
    });

    it('coerces non-integer values via truncation (consistent with modulo)', () => {
      expect(Num.toLetter(0.9)).to.eql('A');
      expect(Num.toLetter(25.9)).to.eql('Z');
      expect(Num.toLetter(26.1)).to.eql('A');
    });
  });

  describe('Num.sum', () => {
    it('returns 0 for an empty array', () => {
      const res = Num.sum([]);
      expect(res).to.equal(0);
    });

    it('sums a single value', () => {
      const res = Num.sum([7]);
      expect(res).to.equal(7);
    });

    it('sums multiple values', () => {
      const res = Num.sum([1, 2, 3, 4]);
      expect(res).to.equal(10);
    });

    it('handles negative numbers', () => {
      const res = Num.sum([5, -2, -3]);
      expect(res).to.equal(0);
    });

    it('handles floating point values', () => {
      const res = Num.sum([0.25, 0.25, 0.5]);
      expect(res).to.equal(1);
    });
  });

  describe('Num constants', () => {
    it('MAX_INT equals Number.MAX_SAFE_INTEGER', () => {
      expect(Num.MAX_INT).to.equal(Number.MAX_SAFE_INTEGER);
    });

    it('MIN_INT equals negative Number.MAX_SAFE_INTEGER', () => {
      expect(Num.MIN_INT).to.equal(-Number.MAX_SAFE_INTEGER);
    });

    it('INFINITY equals Number.POSITIVE_INFINITY', () => {
      expect(Num.INFINITY).to.equal(Number.POSITIVE_INFINITY);
    });

    it('constants are readonly numbers', () => {
      expect(typeof Num.MAX_INT).to.equal('number');
      expect(typeof Num.MIN_INT).to.equal('number');
      expect(typeof Num.INFINITY).to.equal('number');
    });
  });
});
