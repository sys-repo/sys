import { describe, expect, it } from '../-test.ts';
import { Value } from '../m.Value/mod.ts';
import { PercentRange } from './m.Percent.Range.ts';
import { Percent } from './m.Percent.ts';
import { Num } from './mod.ts';

describe('Value.Num', () => {
  it('API', () => {
    expect(Value.Num).to.equal(Num);
    expect(Num.Percent).to.equal(Percent);
    expect(Num.Percent.Range).to.eql(PercentRange);
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
      expect(Value.round(0, -1)).to.eql(0);
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
});
