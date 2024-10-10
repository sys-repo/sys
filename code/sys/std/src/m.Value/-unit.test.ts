import { describe, expect, it } from '../-test.ts';
import { ArrayLib } from '../m.Value.Array/mod.ts';
import { Num, Str, Value, isObject } from './mod.ts';

describe('Value', () => {
  it('API', () => {
    expect(Value.Array).to.equal(ArrayLib);
    expect(Value.Str).to.equal(Str);
    expect(Value.Num).to.equal(Num);
    expect(Value.round).to.equal(Num.round);
    expect(Value.isObject).to.equal(isObject);
  });

  describe('Number', () => {
    describe('round', () => {
      it('should round to no decimal places by default', () => {
        expect(Value.round(1.2345)).to.eql(1);
        expect(Value.round(1.5)).to.eql(2);
        expect(Value.round(1.4)).to.eql(1);
      });

      it('should round to the specified number of decimal places', () => {
        expect(Value.round(1.2345, 2)).to.eql(1.23);
        expect(Value.round(1.235, 2)).to.eql(1.24);
        expect(Value.round(1.2345, 3)).to.eql(1.235);
      });

      it('should handle negative precision correctly', () => {
        expect(Value.round(12345, -1)).to.eql(12350);
        expect(Value.round(12345, -2)).to.eql(12300);
      });

      it('should round negative numbers correctly', () => {
        expect(Value.round(-1.2345)).to.eql(-1);
        expect(Value.round(-1.5)).to.eql(-1);
        expect(Value.round(-1.51)).to.eql(-2);
        expect(Value.round(-1.4)).to.eql(-1);
        expect(Value.round(-1.2345, 2)).to.eql(-1.23);
      });

      it('should round zero correctly', () => {
        expect(Value.round(0)).to.eql(0);
        expect(Value.round(0.1234, 2)).to.eql(0.12);
        expect(Value.round(0, -1)).to.eql(0);
      });
    });
  });

  describe('String', () => {
    it('capitalize', () => {
      const NON = [123, true, null, undefined, BigInt(0), Symbol('foo'), {}, []];
      NON.forEach((v: any) => {
        expect(Str.capitalize(v)).to.eql(String(v));
      });

      expect(Str.capitalize('')).to.eql('');
      expect(Str.capitalize('  ')).to.eql('  ');
      expect(Str.capitalize('hello')).to.eql('Hello');
      expect(Str.capitalize('HeLLO')).to.eql('HeLLO');
    });
  });
});
